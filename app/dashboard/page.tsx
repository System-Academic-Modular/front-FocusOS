import { 
  CheckCircle2, Flame, Sparkles, Target, Zap, Brain, 
  AlertTriangle, ShieldCheck, TrendingUp, Clock, LayoutDashboard
} from 'lucide-react'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { TimelineView } from '@/components/dashboard/timeline-view'
import { EmotionalCheckinPrompt } from '@/components/dashboard/emotional-checkin-prompt'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/server'
import { getEffortProgress } from '@/lib/effort'
import { cn } from '@/lib/utils'
import type { Tarefa, Categoria } from '@/lib/types'
import { normalizeCategory, normalizeTask } from '@/lib/normalizers'

async function calcularSequenciaReal(
  sessions: { concluido_em: string }[],
  hoje = new Date(),
): Promise<number> {
  if (!sessions.length) return 0
  const diasComFoco = new Set(sessions.map((s) => startOfDay(new Date(s.concluido_em)).getTime()))
  let cursor = startOfDay(hoje)
  if (!diasComFoco.has(cursor.getTime())) cursor = subDays(cursor, 1)
  let streak = 0
  while (diasComFoco.has(cursor.getTime())) {
    streak++
    cursor = subDays(cursor, 1)
  }
  return streak
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const agora = new Date()
  const inicioHoje = startOfDay(agora)
  const fimHoje = endOfDay(agora)

  const saudacao = agora.getHours() < 12 ? 'Bom dia' : agora.getHours() < 18 ? 'Boa tarde' : 'Boa noite'
  const labelData = agora.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  const [
    perfilRes, tarefasTimelineRes, categoriasRes, checkinHojeRes, totalConcluidasRes, esforcoHojeRes, sessoesStreakRes, maestriaRes,
  ] = await Promise.all([
    supabase.from('perfis').select('nome_completo').eq('id', user.id).maybeSingle(),
    supabase.from('tarefas').select('*, categoria:categorias(*)').eq('usuario_id', user.id).is('tarefa_pai_id', null).neq('status', 'concluida').order('data_vencimento', { ascending: true, nullsFirst: false }),
    supabase.from('categorias').select('*').eq('usuario_id', user.id).order('nome'),
    supabase.from('checkins_emocionais').select('*').eq('usuario_id', user.id).gte('criado_em', inicioHoje.toISOString()).maybeSingle(),
    supabase.from('tarefas').select('id', { count: 'exact', head: true }).eq('usuario_id', user.id).eq('status', 'concluida'),
    supabase.from('tarefas').select('status, carga_mental, minutos_estimados, data_vencimento').eq('usuario_id', user.id).gte('data_vencimento', inicioHoje.toISOString()).lt('data_vencimento', fimHoje.toISOString()),
    supabase.from('sessoes_pomodoro').select('concluido_em').eq('usuario_id', user.id).eq('tipo', 'foco').order('concluido_em', { ascending: false }).limit(100),
    supabase.from('mastery_status').select('*').eq('user_id', user.id).order('score', { ascending: false }),
  ])

  const nomeCompleto = perfilRes.data?.nome_completo || (perfilRes.data as any)?.full_name || ''
  const primeiroNome = nomeCompleto.split(' ')[0] || 'Explorador'

  const tarefasTimeline = (tarefasTimelineRes.data || []).map(normalizeTask) as Tarefa[]
  const categorias = (categoriasRes.data || []).map(normalizeCategory) as Categoria[]
  const totalConcluidas = totalConcluidasRes.count || 0
  const streak = await calcularSequenciaReal(sessoesStreakRes.data || [])
  const progressoEsforco = getEffortProgress(esforcoHojeRes.data || [])

  const dadosMaestria = (maestriaRes.data || []).map((m: any) => {
    const lastStudy = m.data_ultimo_estudo || m.last_study_date || m.last_session_at || null
    const ultimaSessao = lastStudy ? new Date(lastStudy) : null
    const diasSemEstudo = ultimaSessao ? Math.floor((agora.getTime() - ultimaSessao.getTime()) / (1000 * 60 * 60 * 24)) : 999
    return {
      score: Number(m.pontuacao || m.score || 0),
      categoria: m.categoria || m.category || (m.category_name ? { nome: m.category_name, cor: m.category_color } : null),
      emRisco: diasSemEstudo >= 3,
      diasSemEstudo
    }
  })

  return (
    <div className="space-y-10 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-1000 max-w-6xl mx-auto">
      {/* HEADER TÁTICO MINIMALISTA */}
      <section className="relative flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-violet/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-cyan/80 mb-2 flex items-center gap-2">
            <LayoutDashboard className="w-3 h-3" /> Painel de Controle
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
            {saudacao}, <span className="text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40">{primeiroNome}</span>.
          </h1>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-3 font-medium">
            {labelData}
          </p>
        </div>
      </section>

      {/* MÉTRICAS FLUTUANTES (Removido o excesso de bordas) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
        {[
          { label: 'Tarefas Hoje', valor: tarefasTimeline.length, icon: Target, cor: 'text-brand-violet' },
          { label: 'Missões Concluídas', valor: totalConcluidas, icon: CheckCircle2, cor: 'text-emerald-400' },
          { label: 'Sequência Ativa', valor: `${streak} Dias`, icon: Flame, cor: streak > 0 ? 'text-orange-400 animate-pulse' : 'text-muted-foreground' },
          { label: 'Carga Mental (XP)', valor: `${progressoEsforco.percentage}%`, icon: Zap, cor: 'text-sky-400', progress: true }
        ].map((m, i) => (
          <div key={i} className="group flex flex-col justify-between bg-white/[0.02] border border-white/[0.05] p-5 rounded-3xl hover:bg-white/[0.04] transition-all duration-500">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-black/40 rounded-lg shadow-inner"><m.icon className={cn("w-3.5 h-3.5", m.cor)} /></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{m.label}</span>
            </div>
            <div className="text-3xl font-[1000] text-white tracking-tighter">{m.valor}</div>
            {m.progress && (
              <Progress value={progressoEsforco.percentage} className="mt-4 h-1 bg-black/50 [&>div]:bg-sky-400" />
            )}
          </div>
        ))}
      </section>

      {/* MAPA DE RETENÇÃO (Mais limpo) */}
      <section className="bg-black/20 border border-white/5 rounded-[2rem] p-6 md:p-8 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="flex items-center gap-3 mb-8">
          <Brain className="h-5 w-5 text-brand-violet" />
          <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Mapa de Retenção Neural</h2>
        </div>

        {dadosMaestria.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dadosMaestria.slice(0, 6).map((item: any, idx: number) => (
              <div key={idx} className={cn(
                "p-4 rounded-2xl border transition-all duration-300 relative",
                item.emRisco ? "bg-red-500/[0.03] border-red-500/20" : "bg-white/[0.02] border-white/5"
              )}>
                <div className="flex justify-between items-center mb-3">
                  <span className={cn("text-xs font-bold truncate", item.emRisco ? "text-red-400" : "text-white/80")}>
                    {item.categoria?.nome || 'Geral'}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">{item.score}%</span>
                </div>
                <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all", item.emRisco ? "bg-red-500" : "bg-brand-violet")} 
                    style={{ width: `${item.score}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-4 uppercase tracking-widest">Aguardando dados de sessões focadas...</p>
        )}
      </section>

      {!checkinHojeRes.data && <EmotionalCheckinPrompt />}

      {/* TIMELINE (Sem a caixa pesada em volta) */}
      <section className="pt-4">
        <div className="flex items-center gap-3 mb-6 pl-2">
          <Clock className="h-4 w-4 text-brand-cyan" />
          <h2 className="text-sm font-black uppercase tracking-widest text-white/80">Vetor de Tarefas</h2>
        </div>
        {tarefasTimeline.length > 0 ? (
          <TimelineView tasks={tarefasTimeline} categories={categorias} />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-3xl bg-white/[0.01]">
             <CheckCircle2 className="h-8 w-8 text-white/20 mb-3" />
             <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold">Nenhum objetivo tático no radar</p>
          </div>
        )}
      </section>
    </div>
  )
}