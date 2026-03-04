'use client'

import React, { useState, useTransition } from 'react'
import type { Category, CognitiveLoad, TaskPriority, TeamMember } from '@/lib/types'
import { createTask } from '@/lib/actions/tasks'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Plus, CalendarIcon, Flag, Loader2, UserRound, Brain } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface QuickAddTaskProps {
  categories: Category[]
  parentId?: string
  selectedTeamId?: string | null
  teamMembers?: TeamMember[]
}

export function QuickAddTask({ categories, parentId, selectedTeamId, teamMembers = [] }: QuickAddTaskProps) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [categoryId, setCategoryId] = useState<string>('none')
  const [assigneeId, setAssigneeId] = useState<string>('none')
  const [cognitiveLoad, setCognitiveLoad] = useState<CognitiveLoad>(3)
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [showOptions, setShowOptions] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!title.trim()) return

    startTransition(async () => {
      const result = await createTask({
        title: title.trim(),
        priority,
        category_id: categoryId === 'none' ? undefined : categoryId,
        due_date: dueDate?.toISOString(),
        parent_id: parentId,
        team_id: selectedTeamId || undefined,
        assignee_id: assigneeId === 'none' ? undefined : assigneeId,
        cognitive_load: cognitiveLoad,
      })

      if (result.error) {
        toast.error('Erro ao criar tarefa', {
          description: result.error,
        })
        return
      }

      toast.success('Tarefa criada!')
      setTitle('')
      setPriority('medium')
      setCategoryId('none')
      setAssigneeId('none')
      setCognitiveLoad(3)
      setDueDate(undefined)
      setShowOptions(false)
    })
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Adicionar nova tarefa..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => setShowOptions(true)}
                disabled={isPending}
                className="border-0 shadow-none focus-visible:ring-0 px-0 text-base"
              />
            </div>
            <Button type="submit" size="sm" disabled={!title.trim() || isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-1 hidden sm:inline">Adicionar</span>
            </Button>
          </div>

          {showOptions && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className="w-[130px] h-8">
                  <Flag className="w-3 h-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>

              {categories.length > 0 && (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="w-[150px] h-8">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {!!selectedTeamId && (
                <Select value={assigneeId} onValueChange={setAssigneeId}>
                  <SelectTrigger className="w-[190px] h-8">
                    <UserRound className="w-3 h-3 mr-1" />
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem responsável</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.profile?.full_name || 'Membro da equipe'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn('h-8 justify-start text-left font-normal', !dueDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dueDate ? format(dueDate, 'dd/MM/yyyy', { locale: ptBR }) : 'Data'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              <Select
                value={String(cognitiveLoad)}
                onValueChange={(value) => setCognitiveLoad(Number(value) as CognitiveLoad)}
              >
                <SelectTrigger className="w-[150px] h-8">
                  <Brain className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Carga mental" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Carga 1 - Leve</SelectItem>
                  <SelectItem value="2">Carga 2</SelectItem>
                  <SelectItem value="3">Carga 3 - Moderada</SelectItem>
                  <SelectItem value="4">Carga 4</SelectItem>
                  <SelectItem value="5">Carga 5 - Intensa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
