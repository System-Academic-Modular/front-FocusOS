export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type PomodoroType = 'work' | 'short_break' | 'long_break'
export type CognitiveLoad = 1 | 2 | 3 | 4 | 5

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string
  daily_goal?: number | null
  pomodoro_duration?: number | null
  short_break?: number | null
  long_break?: number | null
  theme_color?: string | null
  theme_mode?: 'light' | 'dark' | 'system' | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon?: string | null
  created_at: string
  updated_at?: string | null
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Team {
  id: string
  name: string
  description: string | null
  owner_id: string
  invite_code: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  team?: Team
  profile?: Profile | null
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  cognitive_load: CognitiveLoad
  due_date: string | null
  position: number | null
  created_at: string
  updated_at: string
  completed_at?: string | null
  team_id?: string | null
  category_id?: string | null
  parent_id?: string | null
  assignee_id?: string | null
  estimated_minutes?: number | null
  actual_minutes?: number | null
  is_recurring?: boolean | null
  recurrence_pattern?: string | null
  category?: Category | null
  assignee?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
  subtasks?: Task[]
}

export interface PomodoroSession {
  id: string
  user_id: string
  task_id: string | null
  duration_minutes: number
  type: PomodoroType
  completed_at: string
}

export interface MasteryScore {
  id: string
  user_id: string
  category_id: string
  score: number
  total_minutes: number
  last_session_at: string | null
  created_at: string
  updated_at: string
  category?: Category | null
}

export type Tarefa = Task
export type Categoria = Category
export type StatusTarefa = TaskStatus
export type PrioridadeTarefa = TaskPriority
export type MembroTime = TeamMember
export type UsuarioProfile = Profile
export type TipoPomodoro = Uppercase<PomodoroType>
