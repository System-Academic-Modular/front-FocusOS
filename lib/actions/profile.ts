'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type SupportedProfileFields = {
  full_name?: string
  daily_goal?: number
  pomodoro_duration?: number
  short_break?: number
  long_break?: number
}

export async function updateProfile(data: SupportedProfileFields) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Sessao expirada. Faca login novamente.' }
  }

  const allowedEntries = Object.entries(data).filter(
    ([key, value]) =>
      ['full_name', 'daily_goal', 'pomodoro_duration', 'short_break', 'long_break'].includes(key) &&
      value !== undefined,
  )

  const updateData = Object.fromEntries(allowedEntries)

  const { error } = await supabase
    .from('profiles')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Erro ao atualizar perfil:', error)
    return { error: 'Nao foi possivel salvar as alteracoes.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: 'Configuracoes salvas com sucesso!' }
}
