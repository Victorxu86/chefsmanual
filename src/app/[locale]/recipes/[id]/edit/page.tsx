import { createClient } from "@/utils/supabase/server"
import { notFound, redirect } from "next/navigation"
import { DashboardHeader } from "@/components/DashboardHeader"
import { RecipeWizard } from "@/components/recipe/RecipeWizard"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditRecipePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Fetch recipe with full details
  const { data: recipe, error } = await supabase
    .from("recipes")
    .select(`
      *,
      recipe_ingredients(*),
      recipe_steps(*)
    `)
    .eq("id", id)
    .eq("author_id", user.id) // Ensure ownership
    .single()

  if (error || !recipe) {
    return notFound()
  }

  // Sort relations
  recipe.recipe_steps.sort((a: any, b: any) => a.step_order - b.step_order)
  recipe.recipe_ingredients.sort((a: any, b: any) => a.display_order - b.display_order)

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail={user.email || ""} />
      <RecipeWizard initialData={recipe} isEditMode={true} />
    </div>
  )
}

