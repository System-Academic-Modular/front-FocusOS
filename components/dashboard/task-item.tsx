'use client'

import { useTransition } from 'react'
import type { Tarefa } from '@/lib/types'
import { updateTask, deleteTask } from '@/lib/actions/tasks'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2, Clock, Calendar, Brain } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface TaskItemProps {
  task: Tarefa
  onEdit: () => void
  showCompleted?: boolean
}

// Mapeamento para os Enums em Inglês do seu Banco
const priorityColors = {
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  medium: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20',
  high: 'bg-brand-amber/10 text-brand-amber border-brand-amber/20',
  urgent: 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse',
}

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

export function TaskItem({ task, onEdit, showCompleted }: TaskItemProps) {
  const [isPending, startTransition] = useTransition()
  
  // Ajustado para 'done' (valor real no banco)
  const isCompleted = task.status === 'done'

  function handleToggleComplete() {
    startTransition(async () => {
      const newStatus = isCompleted ? 'todo' : 'done'
      
      // Enviando 'id' e 'status' em inglês para a action
      const result = await updateTask(task.id, { status: newStatus })
      
      if (result.error) {
        toast.error('Erro ao atualizar tarefa')
        return
      }

      if (newStatus === 'done') {
        confetti({
          particleCount: 40,
          spread: 70,
          origin: { y: 0.8 },
          colors: ['#8b5cf6', '#06b6d4', '#10b981'],
        })
        toast.success('Tarefa concluída!', {
          description: 'Ótimo trabalho! Foco no próximo objetivo.',
        })
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTask(task.id)
      if (result.error) {
        toast.error('Erro ao excluir tarefa')
        return
      }
      toast.success('Tarefa excluída')
    })
  }

  // Ajustado para 'due_date'
  const dueDate = task.due_date ? new Date(task.due_date) : null
  const isOverdue = dueDate && dueDate < new Date() && !isCompleted

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
  }

  return (
    <Card className={cn(
      'transition-all duration-300 group relative overflow-hidden bg-card/40 border-white/5 hover:border-brand-violet/40 hover:shadow-lg hover:shadow-brand-violet/5',
      isPending && 'opacity-50 pointer-events-none scale-[0.98]',
      isCompleted && 'bg-white/[0.02] grayscale-[0.5] hover:grayscale-0'
    )}>
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 transition-all",
        isCompleted ? "bg-brand-emerald" : "bg-transparent group-hover:bg-brand-violet/40"
      )} />

      <CardContent className="p-4 pl-5">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-2 mt-1 relative z-10">
            <Checkbox
              checked={isCompleted}
              onCheckedChange={handleToggleComplete}
              className={cn(
                "h-5 w-5 border-white/20 transition-all rounded-md data-[state=checked]:bg-brand-emerald data-[state=checked]:border-brand-emerald",
                !isCompleted && "hover:border-brand-violet/50 hover:bg-brand-violet/10"
              )}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <h3 className={cn(
                  'font-semibold text-base transition-all duration-300',
                  isCompleted ? 'text-muted-foreground line-through' : 'text-white group-hover:text-brand-cyan transition-colors'
                )}>
                  {task.title}
                </h3>
                
                {task.description && (
                  <p className={cn(
                    'text-sm text-muted-foreground line-clamp-2 leading-relaxed transition-opacity',
                    isCompleted && 'opacity-50'
                  )}>
                    {task.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider h-5", priorityColors[task.priority])}>
                    {priorityLabels[task.priority]}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="h-5 border-sky-500/20 bg-sky-500/10 text-[10px] font-semibold text-sky-300"
                  >
                    <Brain className="mr-1 h-3 w-3" />
                    Carga {task.cognitive_load}
                  </Badge>

                  {task.category && (
                    <Badge 
                      variant="outline"
                      className="text-[10px] h-5 bg-black/20"
                      style={{ borderColor: `${task.category.color}40`, color: task.category.color }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: task.category.color }} />
                      {task.category.name}
                    </Badge>
                  )}

                  {task.estimated_minutes && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                      <Clock className="w-3 h-3 text-brand-cyan" />
                      {task.estimated_minutes}m
                    </span>
                  )}

                  {dueDate && (
                    <span className={cn(
                      'text-[11px] flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/5',
                      isOverdue ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-white/5 text-muted-foreground'
                    )}>
                      <Calendar className="w-3 h-3" />
                      {dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  )}

                  {task.assignee && (
                    <div className="flex items-center gap-2 ml-auto group/assignee cursor-pointer" title={`Responsável: ${task.assignee.full_name}`}>
                      <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                        {task.assignee.full_name?.split(' ')[0]}
                      </span>
                      <Avatar className="h-6 w-6 border border-white/10 ring-2 ring-transparent group-hover/assignee:ring-brand-violet/30 transition-all shadow-sm">
                        <AvatarImage src={task.assignee.avatar_url || ''} />
                        <AvatarFallback className="text-[9px] bg-brand-violet/20 text-brand-violet font-bold">
                          {getInitials(task.assignee.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 relative z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-[#18181b] border-white/10 shadow-2xl">
                    <DropdownMenuItem onClick={onEdit} className="cursor-pointer focus:bg-white/10 focus:text-white">
                      <Pencil className="mr-2 h-4 w-4 text-brand-cyan" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
