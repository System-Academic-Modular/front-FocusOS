import type { ColunaKanban } from '@/lib/types'

export const DEFAULT_KANBAN_COLUMNS: Array<Pick<ColunaKanban, 'status' | 'titulo' | 'ordem'>> = [
  { status: 'pendente', titulo: 'A FAZER', ordem: 0 },
  { status: 'em_progresso', titulo: 'EM FOCO', ordem: 1 },
  { status: 'revisao', titulo: 'REVISÃO', ordem: 2 },
  { status: 'concluida', titulo: 'CONCLUÍDAS', ordem: 3 },
]