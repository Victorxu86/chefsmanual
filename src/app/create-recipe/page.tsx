import { DashboardHeader } from "@/components/DashboardHeader"
import { RecipeWizard } from "@/components/recipe/RecipeWizard"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function CreateRecipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail={user.email || ""} />
      <RecipeWizard />
    </div>
  )
}
