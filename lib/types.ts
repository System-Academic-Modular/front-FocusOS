// ----------------------------------------------------------------------
// TIPOS BASE (LITERAIS)
// ----------------------------------------------------------------------
export type StatusTarefa = 'pendente' | 'em_progresso' | 'revisao' | 'concluida'
export type PrioridadeTarefa = 'baixa' | 'media' | 'alta' | 'urgente'
export type TipoPomodoro = 'foco' | 'pausa_curta' | 'pausa_longa'
export type CargaMental = 1 | 2 | 3 | 4 | 5

// ----------------------------------------------------------------------
// TABELAS DO BANCO DE DADOS
// ----------------------------------------------------------------------

export interface Perfil {
  id: string
  nome_completo: string
  avatar_url?: string
  email?: string
  meta_diaria?: number | null
  duracao_pomodoro?: number | null
  pausa_curta?: number | null
  pausa_longa?: number | null
  tema_padrao?: string | null
  xp: number
  nivel_atual: number
  criado_em: string
  atualizado_em: string
}

export interface Categoria {
  id: string
  usuario_id: string
  nome: string
  cor: string
  icone?: string | null
  criado_em: string
}

export interface CreateCategoryInput {
  nome: string
  cor: string
}

export interface UpdateCategoryInput {
  nome?: string
  cor?: string
  icone?: string | null
}

export interface Equipe {
  id: string
  nome: string
  descricao: string | null
  dono_id: string
  codigo_convite: string
  criado_em: string
}

export interface MembroEquipe {
  id: string
  equipe_id: string
  usuario_id: string
  papel: 'dono' | 'admin' | 'membro'
  entrou_em: string
  equipe?: Equipe
  perfil?: Perfil | null
}

export interface Tarefa {
  id: string
  usuario_id: string
  categoria_id?: string | null
  equipe_id?: string | null
  tarefa_pai_id?: string | null
  atribuido_a?: string | null
  titulo: string
  descricao?: string | null
  status: StatusTarefa
  prioridade: PrioridadeTarefa
  carga_mental: CargaMental
  data_vencimento?: string | null
  minutos_estimados?: number | null
  data_conclusao?: string | null
  proxima_revisao?: string | null
  contagem_revisoes: number
  criado_em: string
  atualizado_em: string
  categoria?: Categoria | null
  atribuido?: Pick<Perfil, 'id' | 'nome_completo' | 'avatar_url'> | null
  subtarefas?: Tarefa[]
}

export interface ColunaKanban {
  id: string
  usuario_id: string
  status: StatusTarefa
  titulo: string
  ordem: number
  criado_em: string
  atualizado_em?: string
}

export interface SessaoPomodoro {
  id: string
  usuario_id: string
  tarefa_id: string | null
  minutos_duracao: number 
  tipo: TipoPomodoro
  concluido_em: string
}

export interface CheckinEmocional {
  id: string
  usuario_id: string
  humor: number
  energia: number
  nota?: string | null
  criado_em: string
}

export interface Integracao {
  id: string
  usuario_id: string
  provedor: string
  access_token?: string | null
  refresh_token?: string | null
  expira_em?: number | null
  criado_em: string
  atualizado_em: string
}

export interface StatusMaestria {
  nivel: number
  xp_atual: number
  proximo_nivel_xp: number
  total_foco_minutos: number
}

export interface MaestriaCategoria {
  id: string
  categoria_id: string
  categoria_nome: string
  categoria_cor: string
  pontuacao: number
  estado: 'aprendendo' | 'dominado' | 'esquecendo'
  data_ultimo_estudo: string
}

// ----------------------------------------------------------------------
// ALIASES DE RETROCOMPATIBILIDADE
// ----------------------------------------------------------------------
export type Task = Tarefa
export type Category = Categoria
export type Profile = Perfil
export type Team = Equipe
export type TeamMember = MembroEquipe
export type TaskStatus = StatusTarefa
export type TaskPriority = PrioridadeTarefa
export type PomodoroSession = SessaoPomodoro
export type PomodoroType = TipoPomodoro
export type KanbanColumn = ColunaKanban
export type CognitiveLoad = CargaMental
export type CheckinEmotional = CheckinEmocional
export type Integration = Integracao