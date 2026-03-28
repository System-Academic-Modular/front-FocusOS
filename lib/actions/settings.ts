'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- 1. Atualizar Perfil Completo ---
export async function updateProfileSettings(data: { nome_completo?: string, pomodoro_foco?: number, pomodoro_pausa?: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado' }

  const updatePayload: Record<string, any> = {
    atualizado_em: new Date().toISOString()
  }

  if (data.nome_completo !== undefined) updatePayload.nome_completo = data.nome_completo
  if (data.pomodoro_foco !== undefined) updatePayload.duracao_pomodoro = data.pomodoro_foco
  if (data.pomodoro_pausa !== undefined) updatePayload.pausa_curta = data.pomodoro_pausa
  
  const { error } = await supabase
    .from('perfis')
    .update(updatePayload)
    .eq('id', user.id)

  if (error) return { error: 'Erro ao atualizar configurações' }

  revalidatePath('/dashboard/settings')
  return { success: 'Configurações atualizadas com sucesso!' }
}

// Retrocompatibilidade
export async function updateProfile(formData: FormData) {
  const fullName = formData.get('fullName') as string;
  return updateProfileSettings({ nome_completo: fullName });
}

// --- 2. Buscar Status das Integrações ---
export async function getIntegrationsStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data } = await supabase
    .from('integracoes') // ATUALIZADO
    .select('provedor, criado_em') // ATUALIZADO
    .eq('usuario_id', user.id) // ATUALIZADO

  // Mapear de volta para o padrão que a UI espera em inglês para não quebrar a tela de Settings agora
  return (data || []).map(int => ({
    provider: int.provedor,
    created_at: int.criado_em
  }))
}

// --- 3. Desconectar Integração ---
export async function disconnectIntegration(provider: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('integracoes') // ATUALIZADO
    .delete()
    .eq('usuario_id', user.id) // ATUALIZADO
    .eq('provedor', provider) // ATUALIZADO

  if (error) return { error: 'Erro ao desconectar.' }

  revalidatePath('/dashboard/settings')
  return { success: 'Desconectado com sucesso.' }
}