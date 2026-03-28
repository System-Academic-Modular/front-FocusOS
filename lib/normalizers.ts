import type {
  Categoria,
  CargaMental,
  Integracao,
  Perfil,
  PrioridadeTarefa,
  SessaoPomodoro,
  StatusTarefa,
  Tarefa,
  TipoPomodoro,
} from '@/lib/types'

function normalizeStatus(value: string | null | undefined): StatusTarefa {
  if (value === 'em_progresso' || value === 'in_progress') return 'em_progresso'
  if (value === 'revisao') return 'revisao'
  if (value === 'concluida' || value === 'done') return 'concluida'
  return 'pendente'
}

function normalizePriority(value: string | null | undefined): PrioridadeTarefa {
  if (value === 'baixa' || value === 'low') return 'baixa'
  if (value === 'alta' || value === 'high') return 'alta'
  if (value === 'urgente' || value === 'urgent') return 'urgente'
  return 'media'
}

function normalizeCognitiveLoad(value: unknown): CargaMental {
  const numeric = Number(value ?? 3)
  if (Number.isNaN(numeric) || numeric < 1) return 1
  if (numeric > 5) return 5
  return numeric as CargaMental
}

function normalizePomodoroType(value: string | null | undefined): TipoPomodoro {
  if (value === 'foco' || value === 'work') return 'foco'
  if (value === 'pausa_curta' || value === 'short_break') return 'pausa_curta'
  if (value === 'pausa_longa' || value === 'long_break') return 'pausa_longa'
  return 'foco'
}

export function normalizeCategory(input: any): Categoria {
  return {
    id: input?.id || '',
    usuario_id: input?.usuario_id || input?.user_id || '',
    nome: input?.nome || input?.name || 'Geral',
    cor: input?.cor || input?.color || '#8b5cf6',
    icone: input?.icone || input?.icon || null,
    criado_em: input?.criado_em || input?.created_at || new Date().toISOString(),
  }
}

export function normalizeProfile(input: any): Perfil {
  return {
    id: input?.id || '',
    nome_completo: input?.nome_completo || input?.full_name || '',
    avatar_url: input?.avatar_url || null,
    email: input?.email || '',
    meta_diaria: input?.meta_diaria ?? input?.daily_goal ?? null,
    duracao_pomodoro: input?.duracao_pomodoro ?? input?.pomodoro_duration ?? null,
    pausa_curta: input?.pausa_curta ?? input?.short_break ?? null,
    pausa_longa: input?.pausa_longa ?? input?.long_break ?? null,
    tema_padrao: input?.tema_padrao || input?.default_theme || null,
    xp: Number(input?.xp ?? 0),
    nivel_atual: Number(input?.nivel_atual ?? 1),
    criado_em: input?.criado_em || input?.created_at || new Date().toISOString(),
    atualizado_em: input?.atualizado_em || input?.updated_at || new Date().toISOString(),
  }
}

export function normalizeIntegration(input: any): Integracao {
  return {
    id: input?.id || '',
    usuario_id: input?.usuario_id || input?.user_id || '',
    provedor: input?.provedor || input?.provider || '',
    access_token: input?.access_token || null,
    refresh_token: input?.refresh_token || null,
    expira_em: input?.expira_em ?? input?.expires_at ?? null,
    criado_em: input?.criado_em || input?.created_at || new Date().toISOString(),
    atualizado_em: input?.atualizado_em || input?.updated_at || new Date().toISOString(),
  }
}

export function normalizeTask(input: any): Tarefa {
  const categoriaRaw = input?.categoria || input?.category || null
  const atribuidoRaw = input?.atribuido || input?.assignee || input?.profile || null

  return {
    id: input?.id || '',
    usuario_id: input?.usuario_id || input?.user_id || '',
    categoria_id: input?.categoria_id ?? input?.category_id ?? null,
    equipe_id: input?.equipe_id ?? input?.team_id ?? null,
    tarefa_pai_id: input?.tarefa_pai_id ?? input?.parent_id ?? null,
    atribuido_a: input?.atribuido_a ?? input?.assignee_id ?? null,
    titulo: input?.titulo || input?.title || '',
    descricao: input?.descricao ?? input?.description ?? null,
    status: normalizeStatus(input?.status),
    prioridade: normalizePriority(input?.prioridade || input?.priority),
    carga_mental: normalizeCognitiveLoad(input?.carga_mental ?? input?.cognitive_load),
    data_vencimento: input?.data_vencimento ?? input?.due_date ?? null,
    minutos_estimados: input?.minutos_estimados ?? input?.estimated_minutes ?? null,
    data_conclusao: input?.data_conclusao ?? input?.completed_at ?? null,
    proxima_revisao: input?.proxima_revisao ?? null,
    contagem_revisoes: Number(input?.contagem_revisoes ?? 0),
    criado_em: input?.criado_em || input?.created_at || new Date().toISOString(),
    atualizado_em: input?.atualizado_em || input?.updated_at || new Date().toISOString(),
    categoria: categoriaRaw ? normalizeCategory(categoriaRaw) : null,
    atribuido: atribuidoRaw
      ? {
          id: atribuidoRaw.id || '',
          nome_completo: atribuidoRaw.nome_completo || atribuidoRaw.full_name || 'Sem responsavel',
          avatar_url: atribuidoRaw.avatar_url || null,
        }
      : null,
    subtarefas: (input?.subtarefas || []).map(normalizeTask),
  }
}

export function normalizePomodoroSession(input: any): SessaoPomodoro {
  return {
    id: input?.id || '',
    usuario_id: input?.usuario_id || input?.user_id || '',
    tarefa_id: input?.tarefa_id ?? input?.task_id ?? null,
    minutos_duracao: Number(input?.minutos_duracao ?? input?.duracao_minutos ?? input?.duration_minutes ?? 0),
    tipo: normalizePomodoroType(input?.tipo || input?.type),
    concluido_em: input?.concluido_em || input?.completed_at || new Date().toISOString(),
  }
}
