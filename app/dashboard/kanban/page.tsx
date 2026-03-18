import { createClient } from '@/lib/supabase/server'
import { KanbanView } from '@/components/dashboard/kanban-view'
import type { Task, Category, TeamMember } from '@/lib/types'
import { normalizeCategory, normalizeTask } from '@/lib/normalizers'
import { DEFAULT_KANBAN_COLUMNS } from '@/lib/constants'
interface KanbanPageProps {
  searchParams: Promise<{
    team?: string
  }>
}

export default async function KanbanPage(props: KanbanPageProps) {
  const { team: teamId } = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const tasksQuery = supabase
    .from('tarefas')
    .select(`
      *,
      categoria:categorias(*),
      atribuido:perfis!atribuido_a(id, nome_completo, avatar_url)
    `)
    .is('tarefa_pai_id', null)
    .order('criado_em', { ascending: false })

  if (teamId) {
    tasksQuery.eq('equipe_id', teamId)
  } else {
    tasksQuery.eq('usuario_id', user.id).is('equipe_id', null)
  }

  const categoriesQuery = supabase
    .from('categorias')
    .select('*')
    .eq('usuario_id', user.id)
    .order('nome')

  const kanbanColumnsQuery = supabase
    .from('kanban_colunas')
    .select('*')
    .eq('usuario_id', user.id)
    .order('ordem', { ascending: true })

  const [tasksRes, categoriesRes, kanbanColumnsRes] = await Promise.all([
    tasksQuery,
    categoriesQuery,
    kanbanColumnsQuery,
  ])

  const tasks = (tasksRes.data || []).map(normalizeTask) as Task[]
  const categories = (categoriesRes.data || []).map(normalizeCategory) as Category[]
  const kanbanColumns =
    (kanbanColumnsRes.data && kanbanColumnsRes.data.length > 0)
      ? kanbanColumnsRes.data
      : DEFAULT_KANBAN_COLUMNS.map((column) => ({
          id: `default-${column.status}`,
          usuario_id: user.id,
          status: column.status,
          titulo: column.titulo,
          ordem: column.ordem,
          criado_em: new Date().toISOString(),
        }))

  let teamMembers: TeamMember[] = []

  if (teamId) {
    const { data: members } = await supabase
      .from('membros_equipe')
      .select('id, equipe_id, usuario_id, papel, entrou_em, perfil:perfis(id, nome_completo, avatar_url)')
      .eq('equipe_id', teamId)

    if (members) {
      teamMembers = members.map((m) => ({
        id: m.id,
        equipe_id: m.equipe_id,
        usuario_id: m.usuario_id,
        papel: m.papel,
        entrou_em: m.entrou_em,
        perfil: Array.isArray(m.perfil) ? m.perfil[0] : m.perfil,
      })) as unknown as TeamMember[]
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden animate-in fade-in duration-700">
      <div className="flex-1 overflow-x-auto custom-scrollbar">
        <KanbanView
          tasks={tasks}
          categories={categories}
          kanbanColumns={kanbanColumns}
          selectedTeamId={teamId || null}
          teamMembers={teamMembers}
        />
      </div>

      <footer className="h-8 flex items-center px-6 border-t border-white/5 bg-black/20 justify-between shrink-0">
        <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
          <span>Board: {teamId ? 'Sincronizacao de Time' : 'Foco Pessoal'}</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>{tasks.length} Objetivos Ativos</span>
        </div>
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-white/10">
          FocusOS Engine v3.1
        </div>
      </footer>
    </div>
  )
}
