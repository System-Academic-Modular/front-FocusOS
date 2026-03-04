import { CheckCircle2, Flame, Sparkles, Target, Zap } from 'lucide-react'
import { subDays } from 'date-fns'
import { TimelineView } from '@/components/dashboard/timeline-view'
import { EmotionalCheckinPrompt } from '@/components/dashboard/emotional-checkin-prompt'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/server'
import { getEffortProgress } from '@/lib/effort'

type StreakSession = {
  completed_at: string
}

async function calculateRealStreak(
  sessions: StreakSession[],
  today = new Date(),
): Promise<number> {
  if (!sessions.length) return 0

  const daysWithStudy = new Set(
    sessions.map((session) => {
      const date = new Date(session.completed_at)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    }),
  )

  const cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)

  if (!daysWithStudy.has(cursor.getTime())) {
    cursor.setTime(subDays(cursor, 1).getTime())
  }

  let streak = 0
  while (daysWithStudy.has(cursor.getTime())) {
    streak += 1
    cursor.setTime(subDays(cursor, 1).getTime())
  }

  return streak
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const dateLabel = now.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const [
    profileResult,
    timelineTasksResult,
    categoriesResult,
    todayCheckinResult,
    totalDoneResult,
    todayEffortResult,
    streakSessionsResult,
    masteryResult,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('tasks')
      .select('*, category:categories(id,name,color)')
      .eq('user_id', user.id)
      .is('parent_id', null)
      .neq('status', 'done')
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
    supabase
      .from('emotional_checkins')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', tomorrowStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done'),
    supabase
      .from('tasks')
      .select('status,cognitive_load,estimated_minutes,due_date')
      .eq('user_id', user.id)
      .gte('due_date', todayStart.toISOString())
      .lt('due_date', tomorrowStart.toISOString()),
    supabase
      .from('pomodoro_sessions')
      .select('completed_at')
      .eq('user_id', user.id)
      .eq('type', 'work')
      .order('completed_at', { ascending: false })
      .limit(120),
    supabase
      .from('mastery_scores')
      .select('score,total_minutes,last_session_at,category:categories(id,name,color)')
      .eq('user_id', user.id)
      .order('score', { ascending: false }),
  ])

  const fullName = profileResult.data?.full_name || ''
  const firstName = fullName.trim().split(/\s+/).filter(Boolean)[0] || 'Explorador'

  const timelineTasks = timelineTasksResult.data || []
  const categories = categoriesResult.data || []
  const todayCheckin = todayCheckinResult.data
  const totalDone = totalDoneResult.count || 0
  const pendingTodayCount = timelineTasks.filter(
    (task) =>
      task.due_date &&
      new Date(task.due_date).getTime() >= todayStart.getTime() &&
      new Date(task.due_date).getTime() < tomorrowStart.getTime(),
  ).length

  const effortProgress = getEffortProgress(todayEffortResult.data || [])
  const streak = await calculateRealStreak((streakSessionsResult.data || []) as StreakSession[])

  const masteryData = (masteryResult.data || []).map((item: any) => {
    const lastSession = item.last_session_at ? new Date(item.last_session_at) : null
    const daysWithoutStudy = lastSession
      ? Math.floor((now.getTime() - lastSession.getTime()) / (1000 * 60 * 60 * 24))
      : 999

    return {
      score: Number(item.score || 0),
      totalMinutes: Number(item.total_minutes || 0),
      lastSessionAt: item.last_session_at as string | null,
      daysWithoutStudy,
      needsAttention: daysWithoutStudy >= 3,
      category: item.category as { id: string; name: string; color: string } | null,
    }
  })

  return (
    <div className="space-y-8 pb-24">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
          {greeting},{' '}
          <span className="bg-gradient-to-r from-brand-violet to-sky-300 bg-clip-text text-transparent">
            {firstName}
          </span>
          .
        </h1>
        <p className="text-sm capitalize text-muted-foreground md:text-base">{dateLabel}</p>
      </section>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Target className="h-4 w-4 text-brand-violet" />
            Para Hoje
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{pendingTodayCount}</span>
            <span className="text-xs text-muted-foreground">tarefas</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Concluídas
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{totalDone}</span>
            <span className="text-xs text-muted-foreground">no total</span>
          </div>
        </div>

        <div className="col-span-2 rounded-2xl border border-orange-400/20 bg-orange-500/10 p-4 backdrop-blur-md md:col-span-1">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-orange-200/80">
            <Flame className="h-4 w-4 text-orange-400" />
            Sequência
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{streak}</span>
            <span className="text-xs text-orange-100/70">dias seguidos</span>
          </div>
        </div>

        <div className="col-span-2 rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-md md:col-span-1">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Zap className="h-4 w-4 text-sky-300" />
            Esforço Mental
          </div>
          <div className="flex items-end justify-between gap-2">
            <span className="text-2xl font-bold text-white">{effortProgress.percentage}%</span>
            <span className="text-xs text-muted-foreground">
              {effortProgress.completedEffort}/{effortProgress.totalEffort} pontos
            </span>
          </div>
          <Progress value={effortProgress.percentage} className="mt-2 h-2 bg-white/10" />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-card/40 p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-violet" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Barras de Maestria</h2>
        </div>

        {masteryData.length > 0 ? (
          <div className="space-y-3">
            {masteryData.slice(0, 6).map((item, index) => (
              <div key={item.category?.id || `mastery-${index}`}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-white/90">
                    {item.category?.name || 'Categoria sem nome'}
                  </span>
                  <span
                    className={item.needsAttention ? 'animate-pulse font-semibold text-rose-300' : 'text-muted-foreground'}
                  >
                    {item.needsAttention
                      ? `Sem estudo há ${item.daysWithoutStudy} dias`
                      : `${Math.round(item.score)}% de maestria`}
                  </span>
                </div>
                <Progress
                  value={item.score}
                  className={item.needsAttention ? 'h-2 bg-rose-500/20' : 'h-2 bg-white/10'}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Complete pomodoros vinculados a tarefas categorizadas para construir sua maestria.
          </p>
        )}
      </section>

      <Separator className="bg-white/10" />

      {!todayCheckin && <EmotionalCheckinPrompt />}

      <section className="min-h-[500px]">
        {timelineTasks.length > 0 ? (
          <TimelineView tasks={timelineTasks} categories={categories} />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-violet/10">
              <CheckCircle2 className="h-8 w-8 text-brand-violet" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">Tudo limpo por aqui.</h3>
            <p className="max-w-sm text-muted-foreground">
              Você não tem tarefas pendentes no momento. Aproveite para planejar os próximos passos.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
