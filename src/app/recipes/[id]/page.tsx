import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"
import { RecipeDetailClient } from "./RecipeDetailClient"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch recipe with relations
  const { data: recipe, error } = await supabase
    .from("recipes")
    .select(`
      *,
      recipe_ingredients(*),
      recipe_steps(*)
    `)
    .eq("id", id)
    .single()

  if (error || !recipe) {
    console.error("Fetch error:", error)
    notFound()
  }

  // Sort steps and ingredients
  recipe.recipe_steps.sort((a: any, b: any) => a.step_order - b.step_order)
  recipe.recipe_ingredients.sort((a: any, b: any) => a.display_order - b.display_order)

  return <RecipeDetailClient recipe={recipe} />
}

