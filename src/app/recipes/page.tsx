import { createClient } from "@/utils/supabase/server"
import { DashboardHeader } from "@/components/DashboardHeader"
import { RecipeGrid } from "@/components/recipe/RecipeGrid"
import { Plus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

// Server Component
export default async function RecipesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch recipes
  const { data: recipes } = await supabase
    .from("recipes")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail={user.email || ""} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-main)]">我的菜谱</h1>
            <p className="text-[var(--color-muted)] mt-1">管理您的 {recipes?.length || 0} 个标准化配方</p>
          </div>
          <Link 
            href="/create-recipe"
            className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-accent)] text-white font-bold hover:opacity-90 transition-all shadow-lg"
          >
            <Plus className="h-4 w-4" /> 新建菜谱
          </Link>
        </div>

        <RecipeGrid recipes={recipes || []} />
      </main>
    </div>
  )
}
