import { createClient } from "@/utils/supabase/server"
import { SessionClient } from "./SessionClient"
import { DashboardHeader } from "@/components/DashboardHeader"
import { redirect } from "next/navigation"

export default async function SessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/login")

  // Fetch all recipes with steps
  const { data: recipes } = await supabase
    .from("recipes")
    .select(`
      *,
      recipe_steps(*)
    `)
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail={user.email || ""} />
      <SessionClient recipes={recipes || []} />
    </div>
  )
}
