'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import {
  Brain, Calendar, GripVertical, Kanban, MoreHorizontal, Pencil,
  Play, Target, Trash2, RefreshCw, Zap, Settings2, Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteTask, updateTask } from '@/lib/actions/tasks'
import { saveKanbanColumns } from '@/lib/actions/kanban-columns'
import { QuickAddTask } from '@/components/dashboard/quick-add-task'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { ZenMode } from '@/components/dashboard/zen-mode'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { Categoria, Tarefa, MembroEquipe } from '@/lib/types'

interface KanbanViewProps {
  tasks: Tarefa[]
  categories: Categoria[]
  kanbanColumns?: Array<{ status: string; titulo: string; ordem: number }>
  selectedTeamId?: string | null
  teamMembers?: MembroEquipe[]
}

type ColumnVisual = { id: string; title: string; className: string; icon: React.ReactNode }

const defaultColumns: ColumnVisual[] = [
  { id: 'pendente', title: 'A FAZER', className: 'border-slate-500/20 bg-slate-500/5', icon: <Target className="w-4 h-4 text-slate-400" /> },
  { id: 'em_progresso', title: 'EM FOCO', className: 'border-brand-violet/30 bg-brand-violet/10', icon: <Zap className="w-4 h-4 text-brand-violet animate-pulse" /> },
  { id: 'revisao', title: 'REVISÃO', className: 'border-emerald-500/30 bg-emerald-500/5', icon: <RefreshCw className="w-4 h-4 text-emerald-400" /> },
  { id: 'concluida', title: 'CONCLUÍDAS', className: 'border-white/10 bg-white/5 opacity-80', icon: <Target className="w-4 h-4 text-white/50" /> },
]

const priorityOrder: Record<Tarefa['prioridade'], number> = {
  urgente: 0, alta: 1, media: 2, baixa: 3,
}

function priorityDot(priority: Tarefa['prioridade']) {
  if (priority === 'urgente') return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse'
  if (priority === 'alta') return 'bg-orange-400'
  if (priority === 'media') return 'bg-brand-cyan'
  return 'bg-slate-500'
}

export function KanbanView({ tasks, categories, kanbanColumns, selectedTeamId, teamMembers = [] }: KanbanViewProps) {
  const router = useRouter()
  const [editingTask, setEditingTask] = useState<Tarefa | null>(null)
  const [zenTask, setZenTask] = useState<Tarefa | null>(null)
  const [draggedTask, setDraggedTask] = useState<Tarefa | null>(null)
  const [isPending, startTransition] = useTransition()
  
  // Controle do Modal de Colunas
  const [isColumnsDialogOpen, setIsColumnsDialogOpen] = useState(false)
  const [columnsDraft, setColumnsDraft] = useState<Array<{ status: string; title: string }>>([])
  const [isSavingColumns, startSavingColumns] = useTransition()

  const memberByUserId = useMemo(() => new Map(teamMembers.map((member) => [member.usuario_id, member])), [teamMembers])

  // Lógica Dinâmica para Mapear as Colunas
  const columns = useMemo<ColumnVisual[]>(() => {
    if (!kanbanColumns?.length) return defaultColumns

    return [...kanbanColumns]
      .sort((a, b) => a.ordem - b.ordem)
      .map((column) => {
        const visual = defaultColumns.find(c => c.id === column.status) || {
           id: column.status,
           title: column.titulo,
           className: 'border-white/10 bg-white/5',
           icon: <Target className="w-4 h-4 text-white/50" />
        }
        return {
          ...visual,
          id: column.status,
          title: (column.titulo || visual.title).toUpperCase(),
        }
      })
  }, [kanbanColumns])

  // Inicializa o modal de edição com as colunas atuais
  useEffect(() => {
    setColumnsDraft(columns.map((column) => ({ status: column.id, title: column.title })))
  }, [columns, isColumnsDialogOpen])

  function saveColumns() {
    startSavingColumns(async () => {
      const payload = columnsDraft.map((column, index) => ({
        status: column.status,
        titulo: column.title.trim() || column.status,
        ordem: index,
      }))

      const result = await saveKanbanColumns(payload)
      if (result.error) {
        toast.error('Erro ao salvar colunas', { description: result.error })
        return
      }

      toast.success('Matriz de Kanban reconfigurada.')
      setIsColumnsDialogOpen(false)
    })
  }

  // Agrupamento Dinâmico de Tarefas (Protegido contra status fantasmas)
  const tasksByColumn = useMemo(() => {
    const groups: Record<string, Tarefa[]> = {}
    
    // Inicializa os arrays das colunas atuais
    columns.forEach(col => groups[col.id] = [])
    
    const fallbackCol = columns[0]?.id || 'pendente'
    if (!groups[fallbackCol]) groups[fallbackCol] = []

    for (const task of tasks) {
      if (groups[task.status]) {
         groups[task.status].push(task)
      } else {
         groups[fallbackCol].push(task) // Previne crashes caso a tarefa venha com status apagado
      }
    }

    for (const columnKey of Object.keys(groups)) {
      groups[columnKey].sort((a, b) => {
        const priorityDiff = priorityOrder[a.prioridade] - priorityOrder[b.prioridade]
        if (priorityDiff !== 0) return priorityDiff
        return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      })
    }

    return groups
  }, [tasks, columns])

  function handleDrop(newStatus: string) {
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null)
      return
    }

    startTransition(async () => {
      // Forçamos "any" aqui apenas no payload visual, o banco aceitará strings soltas graças ao SQL
      const result = await updateTask(draggedTask.id, { status: newStatus as any })
      if (result.error) {
        toast.error('Erro de Rede', { description: result.error })
      } else if (newStatus === 'concluida') {
        confetti({ particleCount: 55, spread: 60, origin: { y: 0.8 }, colors: [draggedTask.categoria?.cor || '#8b5cf6', '#38bdf8', '#4f46e5'] })
        toast.success('Missão concluída! Módulo Neural fixado.')
      } else {
        toast.success('Sincronização de Painel Concluída.')
      }
      setDraggedTask(null)
    })
  }

  function onDeleteTask(taskId: string) {
    startTransition(async () => {
      const result = await deleteTask(taskId)
      if (result.error) {
        toast.error('Falha de exclusão', { description: result.error })
        return
      }
      toast.success('Missão abortada com sucesso.')
    })
  }

  const renderCognitiveBattery = (load: number = 3) => (
    <div className="flex items-center gap-[2px]" title={`Carga Mental: Nível ${load}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={cn("w-1.5 h-2.5 rounded-[1px] transition-all", i < load ? "bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.5)]" : "bg-white/10")} />
      ))}
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col space-y-6 relative">
      <div className="absolute top-0 left-1/4 w-[50vw] h-[50vw] bg-brand-violet/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10 px-1">
        <div>
          <h1 className="flex items-center gap-3 text-xl sm:text-2xl font-black uppercase tracking-widest text-white">
            <Kanban className="h-6 w-6 text-brand-violet" /> Fluxo Tático
          </h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
            {selectedTeamId ? 'PROTOCOLOS DA EQUIPE SINCRONIZADOS.' : 'CONTROLE DE PIPELINE NEURAL.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsColumnsDialogOpen(true)} className="h-9 border-white/10 bg-black/40 hover:bg-white/10 text-[10px] uppercase tracking-widest font-black">
          <Settings2 className="w-3.5 h-3.5 mr-2" /> Colunas
        </Button>
      </div>

      <div className="relative z-10">
         <QuickAddTask categories={categories} selectedTeamId={selectedTeamId} teamMembers={teamMembers} />
      </div>

      <div className="flex min-h-0 flex-1 gap-5 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent custom-scrollbar relative z-10 px-1">
        {columns.map((column) => (
          <div
            key={column.id}
            className={cn('flex min-h-[500px] w-[320px] shrink-0 snap-center flex-col rounded-[24px] border p-4 backdrop-blur-xl transition-all duration-300', column.className, draggedTask && draggedTask.status !== column.id && "border-dashed border-white/20 bg-black/40 scale-[0.98]", draggedTask && draggedTask.status === column.id && "ring-2 ring-brand-violet/30 bg-black/60")}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
            onDrop={(e) => { e.preventDefault(); handleDrop(column.id) }}
          >
            <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 text-white/90">
                {column.icon} {column.title}
              </h3>
              <Badge variant="outline" className="border-white/10 bg-black/40 text-[10px] font-mono shadow-inner text-muted-foreground">
                {tasksByColumn[column.id]?.length || 0}
              </Badge>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {tasksByColumn[column.id]?.map((task) => {
                const assignee = task.atribuido_a ? memberByUserId.get(task.atribuido_a) : null
                const assigneeName = assignee?.perfil?.nome_completo || task.atribuido?.nome_completo || 'Sem responsável'
                const initials = assigneeName.split(' ').map((c) => c.charAt(0)).join('').slice(0, 2).toUpperCase()
                const isOverdue = !!task.data_vencimento && new Date(task.data_vencimento).getTime() < Date.now() && task.status !== 'concluida'

                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(e) => { setDraggedTask(task); e.dataTransfer.effectAllowed = 'move' }}
                    className={cn('group relative rounded-2xl border bg-black/60 p-4 shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-grab active:cursor-grabbing backdrop-blur-sm', 'border-white/10 hover:border-white/30 hover:shadow-[0_5px_20px_rgba(139,92,246,0.1)]', isPending && draggedTask?.id === task.id && 'scale-95 opacity-40', task.status === 'concluida' && 'grayscale-[0.5] opacity-60 hover:grayscale-0 hover:opacity-100')}
                    style={{ '--hover-glow': task.categoria?.cor || 'var(--brand-violet)' } as React.CSSProperties}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-500 bg-transparent group-hover:bg-[var(--hover-glow)]" />
                    <div className="mb-3 flex items-start justify-between gap-2 pl-1">
                      {task.categoria ? (
                        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded-full border border-white/5" style={{ color: task.categoria.cor }}>
                          <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: task.categoria.cor }} />
                          {task.categoria.nome}
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/5">GERAL</span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 transition-opacity md:group-hover:opacity-100">
                        {task.status !== 'concluida' && (
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-brand-violet hover:bg-brand-violet/20 hover:text-white" onClick={(e) => { e.stopPropagation(); setZenTask(task) }}>
                            <Play className="h-3 w-3 fill-current ml-0.5" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground hover:bg-white/10 hover:text-white">
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-white/10 bg-[#0c0c0e]/95 backdrop-blur-xl shadow-2xl rounded-xl">
                            <DropdownMenuItem onClick={() => setEditingTask(task)} className="focus:bg-white/10 cursor-pointer font-black uppercase tracking-widest text-[10px]">
                              <Pencil className="mr-2 h-3.5 w-3.5 text-brand-cyan" /> Editar Missão
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem onClick={() => onDeleteTask(task.id)} className="text-red-400 focus:bg-red-500/10 focus:text-red-300 cursor-pointer font-black uppercase tracking-widest text-[10px]">
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Abortar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <h4 className={cn('pl-1 line-clamp-2 pr-2 text-sm font-bold text-white/90 group-hover:text-white transition-colors', task.status === 'concluida' && 'line-through text-white/40')}>
                      {task.titulo}
                    </h4>
                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 pl-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5"><Brain className="w-3 h-3 text-sky-400" />{renderCognitiveBattery(task.carga_mental)}</div>
                        <span className={cn('h-1.5 w-1.5 rounded-full', priorityDot(task.prioridade))} title={`Prioridade: ${task.prioridade}`} />
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {task.data_vencimento && (
                          <span className={cn('inline-flex items-center gap-1 text-[9px] uppercase font-bold tracking-widest bg-white/5 px-1.5 py-0.5 rounded-md border border-white/5', isOverdue ? 'text-rose-400 border-rose-500/30 animate-pulse' : 'text-muted-foreground')}>
                            <Calendar className="h-2.5 w-2.5" />
                            {new Date(task.data_vencimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                        {task.atribuido_a && (
                          <Avatar className="h-6 w-6 border border-white/10 ring-2 ring-transparent group-hover:ring-brand-violet/50 transition-all shadow-md ml-1" title={assigneeName}>
                            <AvatarImage src={assignee?.perfil?.avatar_url || task.atribuido?.avatar_url || ''} />
                            <AvatarFallback className="bg-brand-violet/20 text-[9px] font-black text-brand-violet">{initials || 'OP'}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}

              {(!tasksByColumn[column.id] || tasksByColumn[column.id].length === 0) && (
                <div className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-black/20 text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 transition-colors hover:border-white/20 hover:text-white/30">
                  <GripVertical className="mb-2 h-5 w-5 opacity-20" /> ZONA DE DROP
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isColumnsDialogOpen} onOpenChange={setIsColumnsDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#09090b]/95 border-white/10 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xs uppercase tracking-widest font-black text-center mb-4">Gerenciar Fluxo de Colunas</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
            {columnsDraft.map((column, index) => (
              <div key={column.status} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                <GripVertical className="w-4 h-4 text-white/20 cursor-move" />
                <Input
                  value={column.title}
                  onChange={(e) => setColumnsDraft(prev => prev.map((item, i) => i === index ? { ...item, title: e.target.value } : item))}
                  className="bg-black/40 border-white/10 h-8 font-bold uppercase text-[10px]"
                  placeholder="Nome da coluna"
                />
                <Button variant="ghost" size="icon" onClick={() => setColumnsDraft(prev => prev.filter((_, i) => i !== index))} className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400 text-muted-foreground">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <Button variant="outline" onClick={() => setColumnsDraft(prev => [...prev, { status: `custom_${Date.now()}`, title: 'Nova Coluna' }])} className="w-full border-dashed border-brand-violet/30 text-brand-violet hover:bg-brand-violet/10 hover:text-brand-violet font-black text-[10px] uppercase tracking-widest mt-2">
               <Plus className="w-4 h-4 mr-2" /> Adicionar Coluna
            </Button>
          </div>

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/5">
            <Button type="button" variant="ghost" onClick={() => setIsColumnsDialogOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={saveColumns} disabled={isSavingColumns} className="bg-brand-violet hover:bg-brand-violet/90 text-white font-black text-[10px] uppercase tracking-widest">
              {isSavingColumns ? 'Calibrando...' : 'Salvar Matriz'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <TaskEditDialog task={editingTask} categories={categories} teamMembers={teamMembers} open={Boolean(editingTask)} onOpenChange={(open) => !open && setEditingTask(null)} />
      <ZenMode isOpen={Boolean(zenTask)} onClose={() => setZenTask(null)} task={zenTask} />
    </div>
  )
}