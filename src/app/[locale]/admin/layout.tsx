import { redirect } from "next/navigation"
import { checkAdminSession } from "./actions"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Simple layout wrapper
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {children}
    </div>
  )
}

