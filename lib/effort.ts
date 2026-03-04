import type { Task } from '@/lib/types'

export function normalizeCognitiveLoad(value?: number | null): 1 | 2 | 3 | 4 | 5 {
  if (!value || Number.isNaN(value)) return 3
  if (value <= 1) return 1
  if (value >= 5) return 5
  return Math.round(value) as 1 | 2 | 3 | 4 | 5
}

export function getTaskEffortPoints(task: Pick<Task, 'cognitive_load' | 'estimated_minutes'>) {
  const load = normalizeCognitiveLoad(task.cognitive_load)
  const durationMultiplier = Math.max(1, Math.round((task.estimated_minutes ?? 25) / 25))
  return load * durationMultiplier
}

export function getEffortProgress(tasks: Array<Pick<Task, 'status' | 'cognitive_load' | 'estimated_minutes'>>) {
  const totalEffort = tasks.reduce((sum, task) => sum + getTaskEffortPoints(task), 0)
  const completedEffort = tasks
    .filter((task) => task.status === 'done')
    .reduce((sum, task) => sum + getTaskEffortPoints(task), 0)

  const percentage = totalEffort > 0 ? Math.min(100, Math.round((completedEffort / totalEffort) * 100)) : 0

  return {
    completedEffort,
    totalEffort,
    percentage,
  }
}
