import { createClient } from "@/utils/supabase/server"
import { MarketClient } from "./MarketClient"
import { DashboardHeader } from "@/components/DashboardHeader"
import { redirect } from "next/navigation"

export default async function MarketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/login")

  // Fetch public recipes
  // Note: We use a separate query to ensure we get recipes marked is_public=true
  // The RLS policy should allow reading ANY recipe where is_public=true
  const { data: publicRecipes, error } = await supabase
    .from("recipes")
    .select(`
      *,
      ingredients:recipe_ingredients(*),
      steps:recipe_steps(*)
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(50) // Initial limit

  if (error) {
      console.error("Error fetching public recipes:", error)
  }

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail={user.email || ""} />
      <MarketClient initialRecipes={publicRecipes || []} userId={user.id} />
    </div>
  )
}

