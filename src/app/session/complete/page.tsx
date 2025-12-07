import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { CompletionClient } from "./CompletionClient"

export default async function CompletionPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const sessionId = searchParams?.session_id

  if (!sessionId || typeof sessionId !== 'string') {
    redirect("/")
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch session details
  const { data: session, error } = await supabase
    .from('cooking_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error || !session) {
    console.error("Error fetching session:", error)
    redirect("/")
  }

  // Verify ownership (RLS handles this usually, but double check doesn't hurt)
  if (session.user_id !== user.id) {
    redirect("/")
  }

  return <CompletionClient session={session} />
}

