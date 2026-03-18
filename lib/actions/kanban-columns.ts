'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ColunaKanban, StatusTarefa } from '@/lib/types'

// 1. REMOVIDO O 'export' AQUI:
const DEFAULT_KANBAN_COLUMNS: Array<Pick<ColunaKanban, 'status' | 'titulo' | 'ordem'>> = [
  { status: 'pendente', titulo: 'A FAZER', ordem: 0 },
  { status: 'em_progresso', titulo: 'EM FOCO', ordem: 1 },
  { status: 'revisao', titulo: 'REVISAO', ordem: 2 },
  { status: 'concluida', titulo: 'CONCLUIDAS', ordem: 3 },
]

export async function saveKanbanColumns(
  columns: Array<{ status: StatusTarefa; titulo: string; ordem: number }>,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const seen = new Set<string>()
  const payload = columns
    .map((column) => ({
      usuario_id: user.id,
      status: column.status,
      titulo: column.titulo.trim() || column.status,
      ordem: column.ordem,
    }))
    .filter((column) => {
      if (seen.has(column.status)) return false
      seen.add(column.status)
      return true
    })

  if (!payload.length) return { error: 'Nenhuma coluna valida enviada.' }

  const { data, error } = await supabase
    .from('kanban_colunas')
    .upsert(payload, { onConflict: 'usuario_id,status' })
    .select('*')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/kanban')
  revalidatePath('/dashboard', 'layout')
  return { data: (data || []) as ColunaKanban[] }
}