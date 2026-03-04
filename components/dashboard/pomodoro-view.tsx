'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { Coffee, Pause, Play, RotateCcw, Target, Timer, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { savePomodoroSession } from '@/lib/actions/pomodoro'
import { updateTask } from '@/lib/actions/tasks'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { PomodoroSession, PomodoroType, Profile, Task } from '@/lib/types'

interface PomodoroViewProps {
  tasks: Task[]
  profile: Profile | null
  todaySessions: PomodoroSession[]
}

type TimerState = 'idle' | 'running' | 'paused'

export function PomodoroView({ tasks, profile, todaySessions }: PomodoroViewProps) {
  const router = useRouter()

  const workDuration = Math.max(1, profile?.pomodoro_duration ?? 25) * 60
  const shortBreakDuration = Math.max(1, profile?.short_break ?? 5) * 60
  const longBreakDuration = Math.max(1, profile?.long_break ?? 15) * 60

  const [timerType, setTimerType] = useState<PomodoroType>('work')
  const [timeLeft, setTimeLeft] = useState(workDuration)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [sessionsCompleted, setSessionsCompleted] = useState(
    todaySessions.filter((session) => session.type === 'work').length,
  )

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) || null,
    [tasks, selectedTaskId],
  )

  const getDurationByType = useCallback(
    (type: PomodoroType) => {
      if (type === 'work') return workDuration
      if (type === 'long_break') return longBreakDuration
      return shortBreakDuration
    },
    [workDuration, shortBreakDuration, longBreakDuration],
  )

  useEffect(() => {
    setTimeLeft(getDurationByType(timerType))
    setTimerState('idle')
  }, [timerType, getDurationByType])

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }, [])

  const handleTimerComplete = useCallback(async () => {
    setTimerState('idle')

    const result = await savePomodoroSession({
      task_id: selectedTaskId,
      duration_minutes: Math.round(getDurationByType(timerType) / 60),
      type: timerType,
    })

    if (result.error) {
      toast.error('Não foi possível salvar a sessão.', { description: result.error })
      return
    }

    if (timerType === 'work') {
      const nextCount = sessionsCompleted + 1
      setSessionsCompleted(nextCount)

      if (selectedTask) {
        await updateTask(selectedTask.id, {
          actual_minutes: (selectedTask.actual_minutes || 0) + Math.round(workDuration / 60),
        })
      }

      confetti({
        particleCount: 95,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#0ea5e9', '#10b981'],
      })

      toast.success('Ciclo de foco concluído!', {
        description: selectedTask?.category?.name
          ? `Maestria em ${selectedTask.category.name} atualizada.`
          : 'Sessão registrada com sucesso.',
      })

      setTimerType(nextCount % 4 === 0 ? 'long_break' : 'short_break')
    } else {
      toast.success('Descanso finalizado. Hora de voltar ao foco.')
      setTimerType('work')
    }

    router.refresh()
  }, [
    getDurationByType,
    router,
    selectedTask,
    selectedTaskId,
    sessionsCompleted,
    timerType,
    workDuration,
  ])

  useEffect(() => {
    if (timerState !== 'running') return

    const interval = setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          clearInterval(interval)
          void handleTimerComplete()
          return 0
        }
        return previous - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState, handleTimerComplete])

  useEffect(() => {
    document.title =
      timerState === 'running' ? `${formatTime(timeLeft)} · Focus OS` : 'Focus OS'
  }, [formatTime, timeLeft, timerState])

  const progress =
    ((getDurationByType(timerType) - timeLeft) / Math.max(getDurationByType(timerType), 1)) * 100
  const isWorkMode = timerType === 'work'

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      <header className="space-y-2 text-center">
        <h1 className="inline-block bg-gradient-to-r from-brand-violet to-sky-300 bg-clip-text text-3xl font-bold tracking-tight text-transparent">
          Modo Deep Work
        </h1>
        <p className="text-muted-foreground">Foque no essencial e alimente sua maestria por disciplina.</p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="relative lg:col-span-2">
          <div
            className={cn(
              'absolute inset-0 rounded-full blur-3xl transition-colors',
              isWorkMode ? 'bg-brand-violet/20' : 'bg-emerald-500/20',
            )}
          />

          <div className="relative flex min-h-[520px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-card/40 p-8 shadow-2xl backdrop-blur-xl lg:p-12">
            <div className="mb-10 flex justify-center gap-2 rounded-full border border-white/10 bg-black/20 p-1">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-full px-6',
                  timerType === 'work' && 'bg-brand-violet text-white shadow-neon-violet',
                )}
                onClick={() => setTimerType('work')}
                disabled={timerState === 'running'}
              >
                <Zap className="mr-2 h-4 w-4" />
                Foco
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-full px-6',
                  timerType === 'short_break' && 'bg-emerald-500 text-white',
                )}
                onClick={() => setTimerType('short_break')}
                disabled={timerState === 'running'}
              >
                <Coffee className="mr-2 h-4 w-4" />
                Pausa Curta
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-full px-6',
                  timerType === 'long_break' && 'bg-sky-500 text-white',
                )}
                onClick={() => setTimerType('long_break')}
                disabled={timerState === 'running'}
              >
                <Coffee className="mr-2 h-4 w-4" />
                Pausa Longa
              </Button>
            </div>

            <div className="mb-10 select-none text-[7.5rem] font-black leading-none tracking-tight text-white drop-shadow-2xl">
              {formatTime(timeLeft)}
            </div>

            <div className="flex items-center gap-4">
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  setTimerState('idle')
                  setTimeLeft(getDurationByType(timerType))
                }}
                className="h-12 w-12 rounded-full border-white/10 bg-black/30 hover:bg-white/10"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              {timerState === 'running' ? (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setTimerState('paused')}
                  className="h-16 rounded-full border-white/10 bg-white/5 px-8 text-lg hover:bg-white/10"
                >
                  <Pause className="mr-2 h-6 w-6 fill-current" />
                  Pausar
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setTimerState('running')}
                  className={cn(
                    'h-16 rounded-full px-10 text-lg shadow-xl transition-transform hover:scale-105',
                    isWorkMode ? 'bg-brand-violet hover:bg-brand-violet/90' : 'bg-emerald-500 hover:bg-emerald-500/90',
                  )}
                >
                  <Play className="mr-2 h-6 w-6 fill-current" />
                  Iniciar
                </Button>
              )}
            </div>

            <Progress value={progress} className="absolute bottom-0 left-0 h-1 w-full rounded-none rounded-b-3xl bg-white/10" />
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-card/40 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Tarefa em foco
            </h3>

            {timerType === 'work' && tasks.length > 0 ? (
              <div className="space-y-3">
                <Select
                  value={selectedTaskId || 'none'}
                  onValueChange={(value) => setSelectedTaskId(value === 'none' ? null : value)}
                  disabled={timerState === 'running'}
                >
                  <SelectTrigger className="h-12 border-white/10 bg-black/20">
                    <SelectValue placeholder="Selecione uma tarefa" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#141a24]">
                    <SelectItem value="none">Sem tarefa específica</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedTask ? (
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>Categoria: {selectedTask.category?.name || 'Sem categoria'}</p>
                    <p>
                      Carga mental: {selectedTask.cognitive_load}/5 · Estimado:{' '}
                      {selectedTask.estimated_minutes || 0} min
                    </p>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="py-2 text-sm text-muted-foreground">
                {timerType === 'work'
                  ? 'Crie tarefas para atrelar maestria às sessões.'
                  : 'Use o intervalo para resetar energia.'}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-card/40 p-5 text-center backdrop-blur-md">
              <Target className="mx-auto mb-2 h-6 w-6 text-brand-violet" />
              <div className="text-2xl font-bold text-white">{sessionsCompleted}</div>
              <div className="text-xs text-muted-foreground">Ciclos hoje</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-card/40 p-5 text-center backdrop-blur-md">
              <Timer className="mx-auto mb-2 h-6 w-6 text-sky-300" />
              <div className="text-2xl font-bold text-white">{Math.round(sessionsCompleted * (workDuration / 60))}</div>
              <div className="text-xs text-muted-foreground">Minutos focados</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-card/40 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Timeline de hoje
            </h3>
            <div className="max-h-[220px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {todaySessions.length > 0 ? (
                todaySessions.slice(0, 8).map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/20 p-2 text-sm"
                  >
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full',
                        session.type === 'work' ? 'bg-brand-violet' : 'bg-emerald-400',
                      )}
                    />
                    <span className="font-medium text-white">
                      {session.type === 'work' ? 'Sessão de foco' : 'Pausa'}
                    </span>
                    <Badge variant="outline" className="ml-auto border-white/10 text-xs text-muted-foreground">
                      {session.duration_minutes} min
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  As sessões concluídas aparecerão aqui.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
