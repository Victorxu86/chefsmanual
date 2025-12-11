import { createClient } from "@/utils/supabase/server"
import { PlanClient } from "./PlanClient"
import { DashboardHeader } from "@/components/DashboardHeader"
import { redirect } from "next/navigation"

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/login")

  // Step 1: Fetch recipes first
  const { data: recipesData, error: recipesError } = await supabase
    .from("recipes")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  if (recipesError) {
      console.error("Error fetching recipes:", recipesError)
  }

  let finalRecipes = recipesData || []

  // Step 2: Fetch ingredients for these recipes if any exist
  if (finalRecipes.length > 0) {
      const recipeIds = finalRecipes.map(r => r.id)
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .in("recipe_id", recipeIds)
      
      if (ingredientsError) {
          console.error("Error fetching ingredients:", ingredientsError)
      } else if (ingredientsData) {
          // Manual join
          finalRecipes = finalRecipes.map(r => ({
              ...r,
              ingredients: ingredientsData.filter(i => i.recipe_id === r.id)
          }))
      }
  }

  // Fallback for undefined ingredients array
  finalRecipes = finalRecipes.map(r => ({
      ...r,
      ingredients: r.ingredients || []
  }))

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail={user.email || ""} />
      <PlanClient recipes={finalRecipes} />
    </div>
  )
}
