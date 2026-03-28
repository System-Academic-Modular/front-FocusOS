'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ColunaKanban } from '@/lib/types'

export async function saveKanbanColumns(
  columns: Array<{ status: string; titulo: string; ordem: number }>,
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  // 1. Limpa e mapeia o payload, garantindo a ordem certa pelo index do array
  const payload = columns.map((column, index) => ({
    usuario_id: user.id,
    status: column.status,
    titulo: column.titulo.trim() || column.status,
    ordem: index, // Força a ordem exata em que estão na tela
  }))

  if (!payload.length) return { error: 'Nenhuma coluna valida enviada.' }

  // 2. Apaga todas as colunas antigas do utilizador (Estratégia mais segura)
  await supabase.from('kanban_colunas').delete().eq('usuario_id', user.id)

  // 3. Insere a nova configuração limpa
  const { data, error } = await supabase
    .from('kanban_colunas')
    .insert(payload)
    .select('*')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/kanban')
  revalidatePath('/dashboard', 'layout')
  return { data: (data || []) as ColunaKanban[] }
}