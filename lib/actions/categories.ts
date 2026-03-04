'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateCategoryInput {
  name: string
  color: string
}

interface UpdateCategoryInput {
  name?: string
  color?: string
}

export async function createCategory(input: CreateCategoryInput) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Nao autenticado' }
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name: input.name,
      color: input.color,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  
  return { data }
}

export async function updateCategory(categoryId: string, input: UpdateCategoryInput) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Nao autenticado' }
  }

  const { data, error } = await supabase
    .from('categories')
    .update({
      ...input,
    })
    .eq('id', categoryId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  
  return { data }
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Nao autenticado' }
  }

  // First, remove category from all tasks
  await supabase
    .from('tasks')
    .update({ category_id: null })
    .eq('category_id', categoryId)
    .eq('user_id', user.id)

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  
  return { success: true }
}
