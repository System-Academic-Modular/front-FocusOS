'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveSpotifyTokens(
  accessToken: string,
  refreshToken: string,
  expiresIn: number,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Nao autorizado' }

  const expiresAt = Date.now() + expiresIn * 1000

  const { error } = await supabase.from('integrations').upsert({
    user_id: user.id,
    provider: 'spotify',
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
