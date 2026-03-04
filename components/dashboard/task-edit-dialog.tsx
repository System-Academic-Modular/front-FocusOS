'use client'

import React, { useState, useEffect, useTransition } from 'react'
import type {
  Tarefa,
  Categoria,
  PrioridadeTarefa,
  StatusTarefa,
  MembroTime,
  CognitiveLoad,
} from '@/lib/types'
import { updateTask, createTask } from '@/lib/actions/tasks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Loader2, Flag, Circle, Clock, Brain } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface TaskEditDialogProps {
  task?: Tarefa | null
  categories?: Categoria[]
  teamMembers?: MembroTime[]
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultParentId?: string | null
}

export function TaskEditDialog({ 
  task = null, 
  categories = [], 
  teamMembers = [], 
  open, 
  onOpenChange,
  defaultParentId = null
}: TaskEditDialogProps) {
  
  // Estados usando os valores do banco (Inglês)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<StatusTarefa>('todo')
  const [priority, setPriority] = useState<PrioridadeTarefa>('medium')
  const [categoryId, setCategoryId] = useState<string>('none')
  const [assigneeId, setAssigneeId] = useState<string>('none')
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('')
  const [cognitiveLoad, setCognitiveLoad] = useState<CognitiveLoad>(3)
  const [parentId, setParentId] = useState<string | null>(defaultParentId)

  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      if (task) {
        setTitle(task.title || '')
        setDescription(task.description || '')
        setStatus(task.status || 'todo')
        setPriority(task.priority || 'medium')
        setCategoryId(task.category_id || 'none')
        setAssigneeId(task.assignee_id || 'none')
        setDueDate(task.due_date ? new Date(task.due_date) : undefined)
        setEstimatedMinutes(task.estimated_minutes?.toString() || '')
        setCognitiveLoad((task.cognitive_load || 3) as CognitiveLoad)
        setParentId(task.parent_id || null)
      } else {
        setTitle('')
        setDescription('')
        setStatus('todo')
        setPriority('medium')
        setCategoryId('none')
        setAssigneeId('none')
        setDueDate(undefined)
        setEstimatedMinutes('')
        setCognitiveLoad(3)
        setParentId(defaultParentId)
      }
    }
  }, [task, open, defaultParentId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('O título da tarefa é obrigatório.')
      return
    }

    startTransition(async () => {
      // Payload com chaves em INGLÊS (Exatamente como as colunas do seu DB)
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        status: status,
        priority: priority,
        parent_id: parentId,
        category_id: categoryId === 'none' ? null : categoryId,
        assignee_id: assigneeId === 'none' ? null : assigneeId,
        due_date: dueDate?.toISOString() || null,
        estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
        cognitive_load: cognitiveLoad,
      }

      try {
        let result
        if (task) {
          result = await updateTask(task.id, payload)
        } else {
          result = await createTask(payload)
        }

        if (result?.error) {
          toast.error('Erro ao salvar', { description: result.error })
          return
        }

        toast.success(task ? 'Tarefa atualizada!' : 'Tarefa criada com sucesso!')
        onOpenChange(false)
      } catch (error) {
        toast.error('Erro inesperado ao salvar tarefa.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-[#09090b]/95 backdrop-blur-xl border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="O que precisa ser feito?" 
                className="bg-transparent border-none text-lg md:text-xl font-semibold px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50 h-auto"
                required 
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Adicione detalhes, links ou notas importantes..." 
                className="bg-white/5 border-white/5 focus-visible:ring-brand-violet/50 resize-none"
                rows={3} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as StatusTarefa)}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="todo"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-slate-400" /> A Fazer</div></SelectItem>
                  <SelectItem value="in_progress"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-brand-violet fill-brand-violet/20" /> Em Foco</div></SelectItem>
                  <SelectItem value="done"><div className="flex items-center"><Circle className="w-3 h-3 mr-2 text-brand-emerald fill-brand-emerald" /> Concluída</div></SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as PrioridadeTarefa)}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="low"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-blue-400" /> Baixa</div></SelectItem>
                  <SelectItem value="medium"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-brand-cyan" /> Média</div></SelectItem>
                  <SelectItem value="high"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-orange-400" /> Alta</div></SelectItem>
                  <SelectItem value="urgent"><div className="flex items-center"><Flag className="w-3 h-3 mr-2 text-red-500" /> Urgente</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder="Sem categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="none" className="text-muted-foreground">Sem categoria</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}80` }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Responsável</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder="Atribuir a..." />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="none" className="text-muted-foreground">Sem responsável</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.profile?.full_name || 'Membro da equipe'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Data de Entrega</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal bg-black/40 border-white/10 hover:bg-white/10', !dueDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'dd MMM yyyy', { locale: ptBR }) : 'Definir prazo'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-white/10 bg-[#18181b]" align="start">
                  <Calendar 
                    mode="single" 
                    selected={dueDate} 
                    onSelect={setDueDate} 
                    initialFocus 
                    locale={ptBR}
                    className="bg-[#18181b] text-white" 
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Estimativa (Min)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="Ex: 30"
                  min="1"
                  className="bg-black/40 border-white/10 pl-9 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Carga Cognitiva</Label>
              <Select
                value={String(cognitiveLoad)}
                onValueChange={(value) => setCognitiveLoad(Number(value) as CognitiveLoad)}
              >
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#18181b] border-white/10 text-white">
                  <SelectItem value="1">
                    <div className="flex items-center">
                      <Brain className="w-3 h-3 mr-2 text-sky-300" /> 1 - Leve
                    </div>
                  </SelectItem>
                  <SelectItem value="2">2 - Baixa</SelectItem>
                  <SelectItem value="3">3 - Moderada</SelectItem>
                  <SelectItem value="4">4 - Alta</SelectItem>
                  <SelectItem value="5">5 - Intensa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-white/5 text-white">
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-brand-violet hover:bg-brand-violet/90 text-white min-w-[120px] shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {task ? 'Guardar' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
