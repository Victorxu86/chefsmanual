import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { LiveSessionClient } from "./LiveSessionClient"

export default async function LiveSessionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <LiveSessionClient />
    </div>
  )
}

