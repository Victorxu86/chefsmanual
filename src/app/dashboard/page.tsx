import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { DashboardHeader } from "@/components/DashboardHeader"
import { DashboardContent } from "./content"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail={user.email || ""} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardContent userName={user.user_metadata.full_name || "Chef"} />
      </main>
    </div>
  )
}

