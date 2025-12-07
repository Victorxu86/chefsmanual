import { createClient } from "@/utils/supabase/server"
import { MenuGeneratorClient } from "./MenuGeneratorClient"
import { DashboardHeader } from "@/components/DashboardHeader"
import { redirect } from "next/navigation"

export default async function MenuGeneratorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Fetch all recipes for selection
  const { data: recipes } = await supabase
    .from("recipes")
    .select("id, title, category, cuisine")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail={user.email || ""} />
      <MenuGeneratorClient recipes={recipes || []} userName={user.user_metadata.full_name || "Chef"} />
    </div>
  )
}

