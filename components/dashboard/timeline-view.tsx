'use client'

import { useMemo, useState, useTransition } from 'react'
import { format, isPast, isToday, isTomorrow, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  AlertCircle,
  ArrowRight,
  Brain,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  MoreHorizontal,
  Target,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { updateTask } from '@/lib/actions/tasks'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { ZenMode } from '@/components/dashboard/zen-mode'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Category, Task } from '@/lib/types'

interface TimelineViewProps {
  tasks: Task[]
  categories?: Category[]
}

function getStatusConfig(task: Task) {
  if (task.status === 'done') {
    return {
      icon: CheckCircle2,
      colorClass: 'text-emerald-400',
      cardClass: 'border-emerald-500/20 bg-emerald-500/[0.08]',
    }
  }

  if (task.priority === 'urgent') {
    return {
      icon: AlertCircle,
      colorClass: 'text-rose-400',
      cardClass: 'border-rose-500/20 bg-rose-500/[0.08]',
    }
  }

  if (task.status === 'in_progress') {
    return {
      icon: Clock,
      colorClass: 'text-brand-violet',
      cardClass: 'border-brand-violet/20 bg-brand-violet/[0.08]',
    }
  }

  return {
    icon: Circle,
    colorClass: 'text-muted-foreground',
    cardClass: 'border-white/10 bg-white/[0.02]',
  }
}

function humanDueDate(dateString: string | null) {
  if (!dateString) return 'Sem data'

  const date = new Date(dateString)
  if (isToday(date)) return 'Hoje'
  if (isTomorrow(date)) return 'Amanhã'
  if (isPast(startOfDay(date))) return 'Atrasada'
  return format(date, "dd 'de' MMM", { locale: ptBR })
}

function cognitiveLoadLabel(cognitiveLoad: number) {
  if (cognitiveLoad <= 1) return 'Leve'
  if (cognitiveLoad >= 5) return 'Máxima'
  if (cognitiveLoad >= 4) return 'Alta'
  if (cognitiveLoad === 3) return 'Moderada'
  return 'Baixa'
}

export function TimelineView({ tasks, categories = [] }: TimelineViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [zenTask, setZenTask] = useState<Task | null>(null)
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const orderedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const aDue = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER
        const bDue = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER
        if (aDue !== bDue) return aDue - bDue
        return (a.position ?? 0) - (b.position ?? 0)
      }),
    [tasks],
  )

  const onQuickComplete = (event: React.MouseEvent, task: Task) => {
    event.stopPropagation()
    if (task.status === 'done' || isPending) return

    setProcessingTaskId(task.id)
    startTransition(async () => {
      const result = await updateTask(task.id, { status: 'done' })
      if (result.error) {
        toast.error('Não foi possível concluir a tarefa.', {
          description: result.error,
        })
      } else {
        confetti({
          particleCount: 50,
          spread: 65,
          origin: { y: 0.8 },
          colors: ['#1d4ed8', '#10b981', '#60a5fa'],
        })
        toast.success('Tarefa concluída e revisões automáticas agendadas.')
      }
      setProcessingTaskId(null)
    })
  }

  return (
    <div className="space-y-4 py-2">
      {orderedTasks.map((task, index) => {
        const statusConfig = getStatusConfig(task)
        const StatusIcon = statusConfig.icon
        const isProcessing = processingTaskId === task.id
        const isLate =
          !!task.due_date &&
          isPast(startOfDay(new Date(task.due_date))) &&
          task.status !== 'done'

        return (
          <div
            key={task.id}
            className="group relative rounded-2xl border border-white/10 bg-card/50 p-4 backdrop-blur-md transition-all hover:border-white/20 hover:bg-card/70"
            style={{ animationDelay: `${index * 60}ms` }}
            onClick={() => setEditingTask(task)}
          >
            <div className="flex items-start gap-4">
              <button
                onClick={(event) => onQuickComplete(event, task)}
                disabled={task.status === 'done' || isPending}
                title={task.status === 'done' ? 'Concluída' : 'Marcar como concluída'}
                className={cn(
                  'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-black/30 transition-transform',
                  statusConfig.colorClass,
                  statusConfig.cardClass,
                  task.status !== 'done' && 'hover:scale-105',
                )}
              >
                {isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <StatusIcon className="h-5 w-5" />
                )}
              </button>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {task.category && (
                    <Badge
                      variant="outline"
                      style={{ borderColor: `${task.category.color}80`, color: task.category.color }}
                      className="bg-black/30"
                    >
                      {task.category.name}
                    </Badge>
                  )}

                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
                      isLate
                        ? 'border-rose-400/30 bg-rose-500/10 text-rose-300'
                        : 'border-white/10 bg-white/[0.03] text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    {humanDueDate(task.due_date)}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/20 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300">
                    <Brain className="h-3 w-3" />
                    Carga {task.cognitive_load} · {cognitiveLoadLabel(task.cognitive_load)}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3
                    className={cn(
                      'text-base font-semibold text-white',
                      task.status === 'done' && 'text-muted-foreground line-through',
                    )}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {task.estimated_minutes ? (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-sky-400" />
                        {task.estimated_minutes} min estimados
                      </span>
                    ) : (
                      <span>Sem estimativa</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {task.status !== 'done' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation()
                          setZenTask(task)
                        }}
                        className="h-7 rounded-full border border-white/10 px-3 text-xs text-sky-300 hover:bg-sky-500/10 hover:text-sky-200"
                      >
                        <Target className="mr-1.5 h-3 w-3" />
                        Focar
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(event) => event.stopPropagation()}
                          className="h-8 w-8 text-muted-foreground hover:bg-white/10 hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-white/10 bg-[#12161f]">
                        <DropdownMenuItem onClick={() => setEditingTask(task)}>
                          Editar tarefa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <span className="hidden items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-xs text-muted-foreground md:inline-flex">
                      Detalhes <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      <TaskEditDialog
        open={Boolean(editingTask)}
        onOpenChange={(open) => !open && setEditingTask(null)}
        task={editingTask}
        categories={categories}
      />

      <ZenMode
        isOpen={Boolean(zenTask)}
        onClose={() => setZenTask(null)}
        taskTitle={zenTask?.title}
      />
    </div>
  )
}
