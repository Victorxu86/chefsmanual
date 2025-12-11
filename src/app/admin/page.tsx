import { redirect } from "next/navigation"
import { checkAdminSession, adminLogout } from "./actions"
import { createClient } from "@/utils/supabase/server"
import { AdminDashboardClient } from "./AdminDashboardClient"
import { LogOut } from "lucide-react"

export default async function AdminPage() {
  const isAdmin = await checkAdminSession()
  if (!isAdmin) {
    redirect("/admin/login")
  }

  const supabase = await createClient()
  
  // Fetch Data
  const [actionsRes, categoriesRes, unitsRes, cuisinesRes, difficultiesRes] = await Promise.all([
    supabase.from("sys_algorithm_actions").select("*").order("category").order("subcategory"),
    supabase.from("sys_dish_categories").select("*").order("schedule_priority", { ascending: false }),
    supabase.from("sys_measurement_units").select("*").order("type"),
    supabase.from("sys_cuisines").select("*").order("label"),
    supabase.from("sys_difficulty_levels").select("*").order("level_value")
  ])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded flex items-center justify-center font-bold text-xs">
              CM
            </div>
            <span className="font-mono font-bold tracking-wider">核心算法控制台</span>
          </div>
          
          <form action={adminLogout}>
            <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest">
              <LogOut className="h-4 w-4" />
              退出登录
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AdminDashboardClient 
          initialActions={actionsRes.data || []} 
          initialCategories={categoriesRes.data || []}
          initialUnits={unitsRes.data || []}
          initialCuisines={cuisinesRes.data || []}
          initialDifficulties={difficultiesRes.data || []}
        />
      </main>
    </div>
  )
}
