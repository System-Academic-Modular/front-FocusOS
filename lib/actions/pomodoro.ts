'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { PomodoroType } from '@/lib/types'

export async function savePomodoroSession(data: {
  task_id?: string | null
  duration_minutes: number
  type: PomodoroType
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Nao autorizado' }

  const { data: session, error } = await supabase
    .from('pomodoro_sessions')
    .insert({
      user_id: user.id,
      task_id: data.task_id ?? null,
      duration_minutes: data.duration_minutes,
      type: data.type,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard', 'layout')
  revalidatePath('/dashboard/reports')
  revalidatePath('/dashboard/pomodoro')

  return { data: session, error: null as null }
}
