'use server'

import { createClient } from '@/utils/supabase/server'

interface SearchParams {
  query?: string
  category?: string
  difficulty?: string
  cuisine?: string
}

export async function searchRecipes(params: SearchParams) {
  const supabase = await createClient()
  
  let query = supabase
    .from('recipes')
    .select(`
      *,
      ingredients:recipe_ingredients(*),
      steps:recipe_steps(*)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  // Text Search
  if (params.query && params.query.trim()) {
    // Simple ILIKE for title and description
    // For better performance, we would use textSearch with an index
    const term = `%${params.query.trim()}%`
    query = query.or(`title.ilike.${term},description.ilike.${term}`)
  }

  // Category Filter
  if (params.category) {
    query = query.eq('category', params.category)
  }

  // Difficulty Filter
  if (params.difficulty) {
    query = query.eq('difficulty', params.difficulty)
  }

  // Cuisine Filter
  if (params.cuisine) {
    query = query.eq('cuisine', params.cuisine)
  }

  const { data, error } = await query.limit(50)

  if (error) {
    console.error("Search recipes error:", error)
    return { error: error.message }
  }

  return { data }
}

