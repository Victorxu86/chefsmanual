'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteRecipe(id: string) {
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  // 2. Delete (RLS will ensure user owns the recipe)
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)
    .eq('author_id', user.id)

  if (error) {
    return { error: "删除失败: " + error.message }
  }

  // 3. Revalidate
  revalidatePath('/recipes')
  return { success: true }
}

