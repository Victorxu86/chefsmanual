import { createClient } from "@/utils/supabase/server"
import { DashboardHeader } from "@/components/DashboardHeader"
import { Plus, Clock, Flame, ChefHat, ArrowRight } from "lucide-react"
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

        {/* Grid */}
        {recipes && recipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <Link 
                key={recipe.id} 
                href={`/recipes/${recipe.id}`}
                className="group block rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] overflow-hidden hover:border-[var(--color-accent)] transition-all hover:shadow-lg"
              >
                {/* Cover Image Placeholder */}
                <div className="aspect-video bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)] relative overflow-hidden">
                  {recipe.cover_image ? (
                    <img src={recipe.cover_image} alt={recipe.title} className="w-full h-full object-cover" />
                  ) : (
                    <ChefHat className="h-12 w-12 opacity-20" />
                  )}
                  
                  {/* Badges */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {recipe.difficulty && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/20 text-white backdrop-blur-md">
                        {recipe.difficulty}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-[var(--color-main)] text-lg mb-2 line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
                    {recipe.title}
                  </h3>
                  <p className="text-sm text-[var(--color-muted)] line-clamp-2 mb-4 h-10">
                    {recipe.description || "暂无描述"}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-[var(--color-muted)] pt-4 border-t border-[var(--color-border-theme)]">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {recipe.total_time_minutes}m
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        {recipe.active_time_minutes}m Active
                      </span>
                    </div>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-[var(--color-border-theme)] rounded-[var(--radius-theme)]">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)] mb-4">
              <ChefHat className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-main)] mb-2">还没有菜谱</h3>
            <p className="text-[var(--color-muted)] mb-6 max-w-md text-center">
              开始创建您的第一个标准化菜谱，体验智能调度的魔力。
            </p>
            <Link 
              href="/create-recipe"
              className="px-6 py-3 rounded-[var(--radius-theme)] bg-[var(--color-main)] text-[var(--color-page)] font-bold hover:opacity-90 transition-all"
            >
              创建第一个菜谱
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

