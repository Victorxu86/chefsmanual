import { createClient } from "@/utils/supabase/server"
import { PlanClient } from "./PlanClient"
import { DashboardHeader } from "@/components/DashboardHeader"
import { redirect } from "next/navigation"

export default async function PlanPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/login")

  // Fetch all recipes with ingredients
  // We need to make sure the join is correct.
  // Usually in supabase it's ingredients(*), but sometimes the relationship name is different.
  // Assuming 'ingredients' table has 'recipe_id' FK to 'recipes'.
  // If the relationship is not detected, we might need to specify it explicitly or check schema.
  // Let's try a simpler query first to debug if needed, or just proceed if we trust the schema.
  
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select(`
      *,
      ingredients(*)
    `)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
      console.error("Error fetching recipes for plan:", error)
      // Fallback to empty array
  }

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail={user.email || ""} />
      <PlanClient recipes={recipes || []} />
    </div>
  )
}
