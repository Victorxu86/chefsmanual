"use client"

import Link from "next/link"
import { ChefHat, Clock, Flame, ArrowRight, Edit2, Trash2 } from "lucide-react"
import { deleteRecipe } from "@/app/[locale]/create-recipe/deleteAction"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface Recipe {
  id: string
  title: string
  description: string
  cover_image: string | null
  difficulty: string
  total_time_minutes: number
  active_time_minutes: number
}

export function RecipeGrid({ recipes: initialRecipes }: { recipes: Recipe[] }) {
  const [recipes, setRecipes] = useState(initialRecipes)
  const router = useRouter()

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    if (!confirm("确定要删除这个菜谱吗？此操作不可恢复。")) return

    const result = await deleteRecipe(id)
    if (result.success) {
      // Optimistic update
      setRecipes(prev => prev.filter(r => r.id !== id))
      router.refresh() // Sync with server
    } else {
      alert(result.error)
    }
  }

  if (recipes.length === 0) {
    return (
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
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {recipes.map((recipe) => (
        <div 
          key={recipe.id} 
          className="group block rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] overflow-hidden hover:border-[var(--color-accent)] transition-all hover:shadow-lg relative"
        >
          {/* Actions (Absolute) */}
          <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="p-2 rounded-full bg-white/90 backdrop-blur text-[var(--color-muted)] hover:text-[var(--color-accent)] shadow-sm"
              title="编辑"
            >
              <Edit2 className="h-4 w-4" />
            </Link>
            <button
              onClick={(e) => handleDelete(recipe.id, e)}
              className="p-2 rounded-full bg-white/90 backdrop-blur text-[var(--color-muted)] hover:text-red-500 shadow-sm"
              title="删除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <Link href={`/recipes/${recipe.id}`} className="block h-full">
            {/* Cover Image Placeholder */}
            <div className="aspect-video bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)] relative overflow-hidden">
              {recipe.cover_image ? (
                <img src={recipe.cover_image} alt={recipe.title} className="w-full h-full object-cover" />
              ) : (
                <ChefHat className="h-12 w-12 opacity-20" />
              )}
              
              {/* Difficulty Badge (Left) */}
              <div className="absolute top-2 left-2">
                {recipe.difficulty && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/40 text-white backdrop-blur-md">
                    {recipe.difficulty}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 flex flex-col h-[calc(100%-aspect-video)]">
              <h3 className="font-bold text-[var(--color-main)] text-lg mb-2 line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">
                {recipe.title}
              </h3>
              <p className="text-sm text-[var(--color-muted)] line-clamp-2 mb-4 h-10 flex-1">
                {recipe.description || "暂无描述"}
              </p>
              
              <div className="flex items-center justify-between text-xs text-[var(--color-muted)] pt-4 border-t border-[var(--color-border-theme)] mt-auto">
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
        </div>
      ))}
    </div>
  )
}

