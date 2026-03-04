'use client'

import { useMemo, useState, useTransition } from 'react'
import confetti from 'canvas-confetti'
import {
  Brain,
  Calendar,
  GripVertical,
  Kanban,
  MoreHorizontal,
  Pencil,
  Target,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteTask, updateTask } from '@/lib/actions/tasks'
import { QuickAddTask } from '@/components/dashboard/quick-add-task'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { ZenMode } from '@/components/dashboard/zen-mode'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Category, Task, TaskStatus, TeamMember } from '@/lib/types'

interface KanbanViewProps {
  tasks: Task[]
  categories: Category[]
  selectedTeamId?: string | null
  teamMembers?: TeamMember[]
}

const columns: { id: TaskStatus; title: string; className: string }[] = [
  { id: 'todo', title: 'A Fazer', className: 'border-slate-500/20 bg-slate-500/10' },
  {
    id: 'in_progress',
    title: 'Em Foco',
    className: 'border-brand-violet/25 bg-brand-violet/10',
  },
  { id: 'done', title: 'Concluídas', className: 'border-emerald-500/25 bg-emerald-500/10' },
]

const priorityOrder: Record<Task['priority'], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

function priorityDot(priority: Task['priority']) {
  if (priority === 'urgent') return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)]'
  if (priority === 'high') return 'bg-orange-400'
  if (priority === 'medium') return 'bg-amber-300'
  return 'bg-slate-400'
}

export function KanbanView({
  tasks,
  categories,
  selectedTeamId,
  teamMembers = [],
}: KanbanViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [zenTask, setZenTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [isPending, startTransition] = useTransition()

  const memberByUserId = useMemo(
    () => new Map(teamMembers.map((member) => [member.user_id, member])),
    [teamMembers],
  )

  const tasksByColumn = useMemo(() => {
    const groups = {
      todo: [] as Task[],
      in_progress: [] as Task[],
      done: [] as Task[],
    }

    for (const task of tasks) {
      groups[task.status].push(task)
    }

    for (const columnKey of Object.keys(groups) as TaskStatus[]) {
      groups[columnKey].sort((a, b) => {
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        return (a.position ?? 0) - (b.position ?? 0)
      })
    }

    return groups
  }, [tasks])

  function handleDrop(newStatus: TaskStatus) {
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    startTransition(async () => {
      const result = await updateTask(draggedTask.id, { status: newStatus })
      if (result.error) {
        toast.error('Erro ao mover tarefa', { description: result.error })
      } else if (newStatus === 'done') {
        confetti({
          particleCount: 55,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#38bdf8', '#4f46e5'],
        })
        toast.success('Tarefa concluída! Revisões foram programadas automaticamente.')
      } else {
        toast.success('Tarefa movida.')
      }
      setDraggedTask(null)
    })
  }

  function onDeleteTask(taskId: string) {
    startTransition(async () => {
      const result = await deleteTask(taskId)
      if (result.error) {
        toast.error('Erro ao excluir tarefa', { description: result.error })
        return
      }
      toast.success('Tarefa excluída.')
    })
  }

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Kanban className="h-6 w-6 text-brand-violet" />
            Fluxo Kanban
          </h1>
          <p className="text-muted-foreground">
            {selectedTeamId
              ? 'Contexto de equipe ativo para distribuição de trabalho.'
              : 'Arraste os cards para manter seu fluxo visual em dia.'}
          </p>
        </div>
      </div>

      <QuickAddTask
        categories={categories}
        selectedTeamId={selectedTeamId}
        teamMembers={teamMembers}
      />

      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10">
        {columns.map((column) => (
          <div
            key={column.id}
            className={cn(
              'flex min-h-[520px] w-[86vw] shrink-0 snap-center flex-col rounded-2xl border p-4 backdrop-blur-sm md:w-auto md:flex-1',
              column.className,
            )}
            onDragOver={(event) => {
              event.preventDefault()
              event.dataTransfer.dropEffect = 'move'
            }}
            onDrop={(event) => {
              event.preventDefault()
              handleDrop(column.id)
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-white">{column.title}</h3>
              <Badge variant="outline" className="border-white/10 bg-black/20">
                {tasksByColumn[column.id].length}
              </Badge>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
              {tasksByColumn[column.id].map((task) => {
                const assignee = task.assignee_id ? memberByUserId.get(task.assignee_id) : null
                const assigneeName =
                  assignee?.profile?.full_name || task.assignee?.full_name || 'Sem responsável'
                const initials = assigneeName
                  .split(' ')
                  .map((chunk) => chunk.charAt(0))
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()

                const isOverdue =
                  !!task.due_date && new Date(task.due_date).getTime() < Date.now() && task.status !== 'done'

                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      setDraggedTask(task)
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                    className={cn(
                      'group rounded-xl border border-white/10 bg-[#101521]/80 p-4 shadow-lg transition-all hover:-translate-y-0.5 hover:border-white/20',
                      isPending && draggedTask?.id === task.id && 'scale-[0.98] opacity-50',
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      {task.category ? (
                        <span
                          className="text-[10px] font-semibold uppercase tracking-widest"
                          style={{ color: task.category.color }}
                        >
                          {task.category.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">Sem categoria</span>
                      )}

                      <div className="flex items-center rounded-md border border-white/10 bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                        {task.status !== 'done' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-none border-r border-white/10 text-sky-300 hover:bg-sky-500/10 hover:text-sky-200"
                            onClick={(event) => {
                              event.stopPropagation()
                              setZenTask(task)
                            }}
                          >
                            <Target className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-none text-muted-foreground hover:bg-white/10 hover:text-white"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-white/10 bg-[#141a25]">
                            <DropdownMenuItem onClick={() => setEditingTask(task)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDeleteTask(task.id)}
                              className="text-rose-300 focus:bg-rose-500/10 focus:text-rose-200"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <h4
                      className={cn(
                        'line-clamp-2 pr-4 text-sm font-semibold text-white',
                        task.status === 'done' && 'text-muted-foreground line-through',
                      )}
                    >
                      {task.title}
                    </h4>

                    <div className="mt-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300">
                        <Brain className="h-3 w-3" />
                        Carga {task.cognitive_load}
                      </span>
                      <span className={cn('h-2 w-2 rounded-full', priorityDot(task.priority))} />
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        {task.due_date && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1',
                              isOverdue && 'font-semibold text-rose-300',
                            )}
                          >
                            <Calendar className="h-3 w-3" />
                            {new Date(task.due_date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {task.assignee_id && (
                          <Avatar className="h-6 w-6 border border-white/10" title={assigneeName}>
                            <AvatarImage
                              src={assignee?.profile?.avatar_url || task.assignee?.avatar_url || ''}
                            />
                            <AvatarFallback className="bg-brand-violet/20 text-[10px] text-brand-violet">
                              {initials || 'SM'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <GripVertical className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                    </div>
                  </article>
                )
              })}

              {tasksByColumn[column.id].length === 0 && (
                <div className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 text-sm text-muted-foreground">
                  <GripVertical className="mb-2 h-6 w-6 opacity-40" />
                  Solte tarefas aqui
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <TaskEditDialog
        task={editingTask}
        categories={categories}
        teamMembers={teamMembers}
        open={Boolean(editingTask)}
        onOpenChange={(open) => !open && setEditingTask(null)}
      />

      <ZenMode isOpen={Boolean(zenTask)} onClose={() => setZenTask(null)} taskTitle={zenTask?.title} />
    </div>
  )
}
