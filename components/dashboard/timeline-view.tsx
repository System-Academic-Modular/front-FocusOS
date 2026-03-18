'use client'

import { useMemo, useState, useTransition } from 'react'
import { format, isPast, isToday, isTomorrow, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { AlertCircle, Brain, Calendar as CalendarIcon, CheckCircle2, Circle, Clock, Loader2, MoreHorizontal, Target, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'
import { toast } from 'sonner'
import { updateTask } from '@/lib/actions/tasks'
import { TaskEditDialog } from '@/components/dashboard/task-edit-dialog'
import { ZenMode } from '@/components/dashboard/zen-mode'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Category, Task, StatusTarefa } from '@/lib/types'

interface TimelineViewProps {
  tasks: Task[]
  categories?: Category[]
}

const ESTILOS_STATUS = {
  concluida: { icon: CheckCircle2, cor: 'text-emerald-400/50', border: 'border-emerald-500/20' },
  urgente: { icon: AlertCircle, cor: 'text-rose-400', border: 'border-rose-500/30' },
  em_progresso: { icon: Zap, cor: 'text-brand-cyan', border: 'border-brand-cyan/30' },
  pendente: { icon: Circle, cor: 'text-white/20', border: 'border-white/10' },
  revisao: { icon: Clock, cor: 'text-amber-400', border: 'border-amber-500/30' },
}

export function TimelineView({ tasks, categories = [] }: TimelineViewProps) {
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [zenTask, setZenTask] = useState<Task | null>(null)
  const [isPending, startTransition] = useTransition()
  const [idsOtimistas, setIdsOtimistas] = useState<string[]>([])

  const tarefasOrdenadas = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aConcluida = a.status === 'concluida' || idsOtimistas.includes(a.id)
      const bConcluida = b.status === 'concluida' || idsOtimistas.includes(b.id)
      if (aConcluida !== bConcluida) return aConcluida ? 1 : -1
      
      const aData = a.data_vencimento ? new Date(a.data_vencimento).getTime() : Infinity
      const bData = b.data_vencimento ? new Date(b.data_vencimento).getTime() : Infinity
      return aData - bData
    })
  }, [tasks, idsOtimistas])

  const concluirTarefa = (e: React.MouseEvent, tarefa: Task) => {
    e.stopPropagation()
    if (tarefa.status === 'concluida' || isPending) return
    setIdsOtimistas(prev => [...prev, tarefa.id])
    
    startTransition(async () => {
      const result = await updateTask(tarefa.id, { status: 'concluida' as StatusTarefa })
      if (result?.error) {
        setIdsOtimistas(prev => prev.filter(id => id !== tarefa.id))
        toast.error('Erro na sincronização', { description: result.error })
      } else {
        confetti({ particleCount: 40, spread: 70, origin: { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }, colors: ['#8B5CF6', '#22D3EE'] })
        toast.success('Missão cumprida!')
      }
    })
  }

  return (
    <div className="relative space-y-2 pb-20">
      {/* Linha guia refinada */}
      <div className="absolute left-[1.15rem] top-4 bottom-8 w-[2px] bg-gradient-to-b from-white/10 via-white/5 to-transparent rounded-full" />

      {tarefasOrdenadas.map((tarefa) => {
        const concluida = tarefa.status === 'concluida' || idsOtimistas.includes(tarefa.id)
        let estilo = ESTILOS_STATUS.pendente
        if (concluida) estilo = ESTILOS_STATUS.concluida
        else if (tarefa.prioridade === 'urgente') estilo = ESTILOS_STATUS.urgente
        else if (tarefa.status === 'em_progresso') estilo = ESTILOS_STATUS.em_progresso
        else if (tarefa.status === 'revisao') estilo = ESTILOS_STATUS.revisao

        const IconeStatus = estilo.icon
        const atrasada = tarefa.data_vencimento && isPast(startOfDay(new Date(tarefa.data_vencimento))) && !concluida

        return (
          <div
            key={tarefa.id}
            onClick={() => setEditingTask(tarefa)}
            className={cn(
              "group relative flex items-center gap-5 p-3 sm:p-4 rounded-[1.5rem] transition-all duration-300 cursor-pointer border border-transparent",
              concluida ? "opacity-40 grayscale hover:opacity-70" : "hover:bg-white/[0.02] hover:border-white/5"
            )}
          >
            {/* Botão de Status mais limpo */}
            <button
              onClick={(e) => concluirTarefa(e, tarefa)}
              disabled={concluida || isPending}
              className={cn("relative z-10 flex shrink-0 items-center justify-center transition-transform hover:scale-110", estilo.cor)}
            >
              {isPending && idsOtimistas.includes(tarefa.id) ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <IconeStatus className={cn("h-5 w-5", concluida && "fill-current opacity-50")} strokeWidth={concluida ? 2 : 2.5} />
              )}
            </button>

            {/* Conteúdo compacto */}
            <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1">
                <h3 className={cn("text-sm sm:text-base font-semibold tracking-tight text-white/90", concluida && "line-through text-white/40")}>
                  {tarefa.titulo}
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  {tarefa.categoria && (
                    <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5" style={{ color: tarefa.categoria.cor }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tarefa.categoria.cor }} />
                      {tarefa.categoria.nome}
                    </span>
                  )}
                  {tarefa.data_vencimento && (
                    <span className={cn("text-[9px] font-bold uppercase tracking-wider flex items-center gap-1", atrasada ? "text-rose-400" : "text-muted-foreground")}>
                      <CalendarIcon className="h-3 w-3" />
                      {isToday(new Date(tarefa.data_vencimento)) ? "Hoje" : isTomorrow(new Date(tarefa.data_vencimento)) ? "Amanhã" : format(new Date(tarefa.data_vencimento), "dd MMM", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>

              {/* Ações (ZenMode / Menu) aparecem no hover em telas grandes */}
              <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                {!concluida && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-brand-cyan hover:bg-brand-cyan/10 hover:text-brand-cyan" onClick={(e) => { e.stopPropagation(); setZenTask(tarefa); }}>
                    <Target className="h-4 w-4" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={e => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#0c0c0e]/95 backdrop-blur-xl border-white/5 rounded-2xl">
                    <DropdownMenuItem onClick={() => setEditingTask(tarefa)} className="text-xs font-bold uppercase tracking-wider">Editar Missão</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs font-bold uppercase tracking-wider text-rose-400 focus:bg-rose-500/10">Abortar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )
      })}

      <TaskEditDialog open={!!editingTask} onOpenChange={(o) => !o && setEditingTask(null)} task={editingTask} categories={categories} />
      <ZenMode isOpen={!!zenTask} onClose={() => setZenTask(null)} task={zenTask} />
    </div>
  )
}