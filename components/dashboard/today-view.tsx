'use client'

import { useState } from 'react'
import type { Task, Category } from '@/lib/types'
import { TaskList } from './task-list'
import { QuickAddTask } from './quick-add-task'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sun, Target, CheckCircle2, Clock } from 'lucide-react'
import { getEffortProgress } from '@/lib/effort'

interface TodayViewProps {
  tasks: Task[]
  categories: Category[]
  completedToday: number
  dailyGoal: number
}

export function TodayView({ tasks, categories, completedToday, dailyGoal }: TodayViewProps) {
  const effort = getEffortProgress(tasks)
  const progress = effort.totalEffort > 0 ? effort.percentage : Math.min((completedToday / dailyGoal) * 100, 100)
  const pendingTasks = tasks.filter(t => t.status !== 'done')
  const completedTasks = tasks.filter(t => t.status === 'done')

  const today = new Date()
  const formattedDate = today.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sun className="w-6 h-6 text-primary" />
            Hoje
          </h1>
          <p className="text-muted-foreground capitalize">{formattedDate}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Meta Diaria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-2xl font-bold text-foreground">
                  {effort.completedEffort}/{effort.totalEffort || dailyGoal}
                </div>
                <p className="text-xs text-muted-foreground">pontos de esforço mental concluídos</p>
                <Progress value={progress} className="mt-2 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {pendingTasks.length}
            </div>
            <p className="text-sm text-muted-foreground">tarefas para fazer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Concluidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {completedTasks.length}
            </div>
            <p className="text-sm text-muted-foreground">tarefas concluidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Add */}
      <QuickAddTask categories={categories} />

      {/* Task Lists */}
      <div className="space-y-6">
        {pendingTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">
              A Fazer ({pendingTasks.length})
            </h2>
            <TaskList tasks={pendingTasks} categories={categories} />
          </div>
        )}

        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-muted-foreground mb-4">
              Concluidas ({completedTasks.length})
            </h2>
            <TaskList tasks={completedTasks} categories={categories} showCompleted />
          </div>
        )}

        {tasks.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Sun className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma tarefa para hoje
              </h3>
              <p className="text-muted-foreground">
                Adicione uma tarefa usando o campo acima
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
