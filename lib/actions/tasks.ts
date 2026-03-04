'use server'

import { revalidatePath } from 'next/cache'
import { normalizeCognitiveLoad } from '@/lib/effort'
import { createClient } from '@/lib/supabase/server'
import type { CognitiveLoad, Task, TaskPriority, TaskStatus } from '@/lib/types'

const TASK_SELECT = `
  *,
  category:categories(id, name, color),
  assignee:profiles!assignee_id(id, full_name, avatar_url)
`

const REVIEW_INTERVALS = [7, 30] as const

type ReviewSeedTask = Pick<
  Task,
  | 'id'
  | 'user_id'
  | 'team_id'
  | 'category_id'
  | 'priority'
  | 'title'
  | 'description'
  | 'estimated_minutes'
  | 'cognitive_load'
>

function normalizePriority(priority?: TaskPriority | null): TaskPriority {
  if (!priority) return 'medium'
  return priority === 'urgent' ? 'high' : priority
}

function getReviewTitle(baseTitle: string) {
  if (baseTitle.startsWith('Revisao Rapida · ')) {
    return baseTitle.replace(/^Revisao Rapida · /, '')
  }
  if (baseTitle.startsWith('Revisão Rápida · ')) {
    return baseTitle.replace(/^Revisão Rápida · /, '')
  }
  return baseTitle
}

function normalizeDbError(error?: { message?: string } | null) {
  return (error?.message || '').toLowerCase()
}

async function insertTaskWithCognitiveFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  payload: Record<string, unknown>,
) {
  const firstTry = await supabase.from('tasks').insert(payload).select(TASK_SELECT).single()
  if (!firstTry.error) return firstTry

  const normalizedMessage = normalizeDbError(firstTry.error)
  if (!normalizedMessage.includes('cognitive_load')) return firstTry

  const { cognitive_load, ...fallbackPayload } = payload
  return supabase.from('tasks').insert(fallbackPayload).select(TASK_SELECT).single()
}

async function updateTaskWithCognitiveFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  payload: Record<string, unknown>,
) {
  const firstTry = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', taskId)
    .select(TASK_SELECT)
    .single()

  if (!firstTry.error) return firstTry

  const normalizedMessage = normalizeDbError(firstTry.error)
  if (!normalizedMessage.includes('cognitive_load')) return firstTry

  const { cognitive_load, ...fallbackPayload } = payload
  return supabase
    .from('tasks')
    .update(fallbackPayload)
    .eq('id', taskId)
    .select(TASK_SELECT)
    .single()
}

async function hasReviewTaskForInterval(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  sourceTask: ReviewSeedTask
  title: string
  dueDateISO: string
}) {
  const { supabase, sourceTask, title, dueDateISO } = params
  const dueDate = new Date(dueDateISO)

  const start = new Date(dueDate)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  let query = supabase
    .from('tasks')
    .select('id')
    .eq('user_id', sourceTask.user_id)
    .eq('title', title)
    .gte('due_date', start.toISOString())
    .lt('due_date', end.toISOString())
    .limit(1)

  if (sourceTask.team_id) {
    query = query.eq('team_id', sourceTask.team_id)
  } else {
    query = query.is('team_id', null)
  }

  const { data } = await query
  return Boolean(data && data.length > 0)
}

async function createSpacedReviewTasks(params: {
  supabase: Awaited<ReturnType<typeof createClient>>
  sourceTask: ReviewSeedTask
  completedAtISO: string
}) {
  const { supabase, sourceTask, completedAtISO } = params

  const baseTitle = getReviewTitle(sourceTask.title)
  const reviewTitle = `Revisao Rapida · ${baseTitle}`

  for (const intervalDays of REVIEW_INTERVALS) {
    const dueDate = new Date(completedAtISO)
    dueDate.setDate(dueDate.getDate() + intervalDays)

    const alreadyExists = await hasReviewTaskForInterval({
      supabase,
      sourceTask,
      title: reviewTitle,
      dueDateISO: dueDate.toISOString(),
    })

    if (alreadyExists) continue

    const insertPayload: Record<string, unknown> = {
      user_id: sourceTask.user_id,
      team_id: sourceTask.team_id ?? null,
      category_id: sourceTask.category_id ?? null,
      title: reviewTitle,
      description: sourceTask.description
        ? `Revisao automatica (${intervalDays} dias): ${sourceTask.description}`
        : `Revisao automatica (${intervalDays} dias).`,
      status: 'todo',
      priority: normalizePriority(sourceTask.priority),
      due_date: dueDate.toISOString(),
      estimated_minutes: sourceTask.estimated_minutes ?? 15,
      is_recurring: false,
      recurrence_pattern: 'spaced_review',
      cognitive_load: normalizeCognitiveLoad((sourceTask.cognitive_load ?? 3) - 1),
    }

    const { error } = await insertTaskWithCognitiveFallback(supabase, insertPayload)

    if (error) {
      // Falha silenciosa: revisão não pode quebrar o fluxo de conclusão da tarefa principal.
      console.error('Erro ao criar revisao automatica:', error.message)
    }
  }
}

export async function getTasks(filters?: {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  category_id?: string
  is_today?: boolean
  search?: string
  team_id?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized', data: [] as Task[] }

  let query = supabase.from('tasks').select(TASK_SELECT).is('parent_id', null)

  if (filters?.team_id) {
    query = query.eq('team_id', filters.team_id)
  } else {
    query = query.eq('user_id', user.id).is('team_id', null)
  }

  if (filters?.status?.length) query = query.in('status', filters.status)
  if (filters?.priority?.length) query = query.in('priority', filters.priority)
  if (filters?.category_id) query = query.eq('category_id', filters.category_id)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

  if (filters?.is_today) {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    query = query.gte('due_date', start.toISOString()).lt('due_date', end.toISOString())
  }

  const { data, error } = await query
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: [] as Task[] }
  return { data: (data || []) as Task[] }
}

export async function createTask(data: Partial<Task>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const payload: Record<string, unknown> = {
    ...data,
    user_id: user.id,
    cognitive_load: normalizeCognitiveLoad(data.cognitive_load),
  }

  const { data: task, error } = await insertTaskWithCognitiveFallback(supabase, payload)

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { data: task as Task }
}

export async function updateTask(id: string, data: Partial<Task>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: currentTask, error: currentTaskError } = await supabase
    .from('tasks')
    .select('id,user_id,team_id,category_id,title,description,status,priority,estimated_minutes,cognitive_load')
    .eq('id', id)
    .single()

  if (currentTaskError || !currentTask) {
    return { error: currentTaskError?.message || 'Task not found' }
  }

  const updateData: Record<string, unknown> = {
    ...data,
    updated_at: new Date().toISOString(),
  }

  if (typeof data.cognitive_load !== 'undefined') {
    updateData.cognitive_load = normalizeCognitiveLoad(data.cognitive_load)
  }

  if (data.status === 'done' && currentTask.status !== 'done') {
    updateData.completed_at = new Date().toISOString()
  } else if (data.status && data.status !== 'done') {
    updateData.completed_at = null
  }

  const { data: task, error } = await updateTaskWithCognitiveFallback(supabase, id, updateData)

  if (error) return { error: error.message }

  if (currentTask.status !== 'done' && task.status === 'done') {
    await createSpacedReviewTasks({
      supabase,
      sourceTask: {
        id: currentTask.id,
        user_id: currentTask.user_id,
        team_id: currentTask.team_id,
        category_id: currentTask.category_id,
        priority: currentTask.priority,
        title: currentTask.title,
        description: currentTask.description,
        estimated_minutes: currentTask.estimated_minutes,
        cognitive_load: normalizeCognitiveLoad(currentTask.cognitive_load),
      },
      completedAtISO: (task.completed_at as string) || new Date().toISOString(),
    })
  }

  revalidatePath('/dashboard', 'layout')
  return { data: task as Task }
}

export async function deleteTask(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}
