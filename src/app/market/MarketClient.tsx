"use client"

import { useState, useTransition } from "react"
import { Search, Filter, Download, Utensils, Clock, Flame, Check, X, ChevronRight, ChevronDown, Plus } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { RECIPE_CATEGORIES, DIFFICULTIES, CUISINES } from "@/lib/constants"
import { useRouter } from "next/navigation"
import { searchRecipes } from "./actions"

interface Recipe {
  id: string
  title: string
  description?: string
  cover_image?: string
  category?: string
  cuisine?: string
  difficulty?: string
  total_time_minutes: number
  author_id: string
  ingredients: any[]
  steps: any[]
}

export function MarketClient({ initialRecipes, userId }: { initialRecipes: Recipe[], userId: string }) {
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes)
  const [importingId, setImportingId] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [showToast, setShowToast] = useState(false) // Toast State
  
  // Search States
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    category: "",
    difficulty: "",
    cuisine: ""
  })
  const [isPending, startTransition] = useTransition()

  const router = useRouter()
  const supabase = createClient()

  const handleSearch = (term: string, currentFilters = filters) => {
    startTransition(async () => {
      const result = await searchRecipes({
        query: term,
        ...currentFilters
      })
      if (result.data) {
        setRecipes(result.data as any)
      }
    })
  }

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value === filters[key as keyof typeof filters] ? "" : value }
    setFilters(newFilters)
    handleSearch(searchQuery, newFilters)
  }

  const handleImport = async (recipe: Recipe) => {
    if (importingId) return
    setImportingId(recipe.id)

    try {
      // 1. Clone Recipe
      const { data: newRecipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          title: `${recipe.title} (已导入)`,
          description: recipe.description,
          cover_image: recipe.cover_image,
          author_id: userId,
          cuisine: recipe.cuisine,
          category: recipe.category,
          difficulty: recipe.difficulty,
          servings: 2, 
          is_public: false, 
          total_time_minutes: recipe.total_time_minutes
        })
        .select()
        .single()

      if (recipeError) throw recipeError

      // 2. Clone Ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
          const ingredientsToInsert = recipe.ingredients.map(ing => ({
              recipe_id: newRecipe.id,
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              category: ing.category,
              display_order: ing.display_order
          }))
          
          const { error: ingError } = await supabase
            .from('recipe_ingredients')
            .insert(ingredientsToInsert)
            
          if (ingError) console.error("Failed to clone ingredients", ingError)
      }

      // 3. Clone Steps
      if (recipe.steps && recipe.steps.length > 0) {
          const stepsToInsert = recipe.steps.map(step => ({
              recipe_id: newRecipe.id,
              step_order: step.step_order,
              instruction: step.instruction,
              duration_seconds: step.duration_seconds,
              step_type: step.step_type,
              is_active: step.is_active,
              equipment: step.equipment
          }))

          const { error: stepError } = await supabase
            .from('recipe_steps')
            .insert(stepsToInsert)

          if (stepError) console.error("Failed to clone steps", stepError)
      }

      // Success Feedback
      setShowToast(true)
      setTimeout(() => setShowToast(false), 5000) // Auto hide after 5s
      
      router.refresh()
      setSelectedRecipe(null)

    } catch (err) {
      console.error("Import failed:", err)
      alert("导入失败，请重试")
    } finally {
      setImportingId(null)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 relative">
      
      {/* Header & Search */}
      <div className="mb-8 space-y-6">
        <div>
            <h1 className="text-3xl font-bold text-[var(--color-main)] tracking-tight">菜谱商店</h1>
            <p className="text-[var(--color-muted)] mt-2">
                探索来自社区的精选食谱，一键导入您的私人厨房。
            </p>
        </div>

        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-muted)]" />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            handleSearch(e.target.value)
                        }}
                        placeholder="搜索菜名、食材或风味..." 
                        className="w-full pl-10 pr-4 py-3 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all"
                    />
                </div>
                <button 
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`px-4 py-3 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] flex items-center gap-2 text-[var(--color-main)] hover:border-[var(--color-accent)] transition-colors ${isFilterOpen ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : ''}`}
                >
                    <Filter className="h-5 w-5" />
                    筛选
                    <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Filter Panel */}
            {isFilterOpen && (
                <div className="p-6 bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] shadow-sm animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Categories */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider">菜品类别</h4>
                            <div className="flex flex-wrap gap-2">
                                {RECIPE_CATEGORIES.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => handleFilterChange('category', c.value)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${filters.category === c.value ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' : 'bg-[var(--color-page)] border-[var(--color-border-theme)] text-[var(--color-main)] hover:border-[var(--color-accent)]'}`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cuisines */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider">菜系风味</h4>
                            <div className="flex flex-wrap gap-2">
                                {CUISINES.map(c => (
                                    <button
                                        key={c.value}
                                        onClick={() => handleFilterChange('cuisine', c.value)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${filters.cuisine === c.value ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' : 'bg-[var(--color-page)] border-[var(--color-border-theme)] text-[var(--color-main)] hover:border-[var(--color-accent)]'}`}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider">烹饪难度</h4>
                            <div className="flex flex-wrap gap-2">
                                {DIFFICULTIES.map(d => (
                                    <button
                                        key={d.value}
                                        onClick={() => handleFilterChange('difficulty', d.value)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${filters.difficulty === d.value ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' : 'bg-[var(--color-page)] border-[var(--color-border-theme)] text-[var(--color-main)] hover:border-[var(--color-accent)]'}`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Loading State */}
      {isPending && (
          <div className="mb-6 text-center text-[var(--color-accent)] animate-pulse text-sm font-bold">
              正在搜索...
          </div>
      )}

      {/* Recipe Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${isPending ? 'opacity-50' : 'opacity-100'}`}>
        {recipes.map(recipe => (
            <div 
                key={recipe.id} 
                onClick={() => setSelectedRecipe(recipe)}
                className="group bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
            >
                {/* Cover Image */}
                <div className="h-48 bg-[var(--color-accent-light)]/20 relative overflow-hidden">
                    {recipe.cover_image ? (
                        <img src={recipe.cover_image} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Utensils className="h-12 w-12 text-[var(--color-accent)]/20" />
                        </div>
                    )}
                    <div className="absolute top-3 right-3 flex gap-2">
                        {recipe.category && (
                            <span className="px-2 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-bold rounded uppercase">
                                {RECIPE_CATEGORIES.find(c => c.value === recipe.category)?.label || recipe.category}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-[var(--color-main)] mb-2 line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">{recipe.title}</h3>
                        <p className="text-sm text-[var(--color-muted)] line-clamp-2 mb-4 h-10">
                            {recipe.description || "暂无描述"}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
                            <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {recipe.total_time_minutes}m
                            </div>
                            <div className="flex items-center gap-1">
                                <Flame className="h-3.5 w-3.5" />
                                {DIFFICULTIES.find(d => d.value === recipe.difficulty)?.label || recipe.difficulty}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[var(--color-border-theme)] flex justify-between items-center">
                        <span className="text-xs text-[var(--color-muted)]">
                            by Chef_{recipe.author_id.slice(0,6)}
                        </span>
                        
                        {recipe.author_id === userId ? (
                            <span className="text-xs font-bold text-[var(--color-accent)] px-3 py-1.5 bg-[var(--color-accent-light)]/10 rounded border border-[var(--color-accent)]/20">
                                我的发布
                            </span>
                        ) : (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleImport(recipe)
                                }}
                                disabled={!!importingId}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[var(--color-main)] text-[var(--color-page)] text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {importingId === recipe.id ? "导入中..." : <><Download className="h-3.5 w-3.5" /> 导入</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        ))}
      </div>
      
      {recipes.length === 0 && !isPending && (
          <div className="text-center py-20 text-[var(--color-muted)]">
              <Utensils className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>暂无匹配菜谱，试着调整一下筛选条件？</p>
          </div>
      )}

      {/* Toast Notification */}
      {showToast && (
          <div className="fixed bottom-8 right-8 bg-[var(--color-card)] border border-[var(--color-border-theme)] p-4 rounded-[var(--radius-theme)] shadow-2xl animate-in slide-in-from-bottom-10 duration-300 flex items-center gap-4 z-50">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  <Check className="h-5 w-5" />
              </div>
              <div>
                  <h4 className="font-bold text-[var(--color-main)]">菜谱导入成功！</h4>
                  <p className="text-xs text-[var(--color-muted)]">已添加到您的私有库中。</p>
              </div>
              <div className="flex gap-2 ml-4">
                  <button 
                    onClick={() => router.push('/plan')}
                    className="px-3 py-1.5 bg-[var(--color-accent)] text-white text-xs font-bold rounded hover:opacity-90 transition-opacity"
                  >
                      去计划备料
                  </button>
                  <button 
                    onClick={() => setShowToast(false)}
                    className="p-1.5 hover:bg-[var(--color-page)] rounded text-[var(--color-muted)] transition-colors"
                  >
                      <X className="h-4 w-4" />
                  </button>
              </div>
          </div>
      )}

      {/* Recipe Preview Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[var(--color-card)] w-full max-w-2xl max-h-[90vh] rounded-[var(--radius-theme)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="relative h-48 bg-[var(--color-accent-light)]/20 shrink-0">
                    {selectedRecipe.cover_image && (
                        <img src={selectedRecipe.cover_image} className="w-full h-full object-cover opacity-90" />
                    )}
                    <button 
                        onClick={() => setSelectedRecipe(null)}
                        className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 pt-20">
                        <h2 className="text-2xl font-bold text-white">{selectedRecipe.title}</h2>
                        <p className="text-white/80 text-sm line-clamp-1 mt-1">{selectedRecipe.description}</p>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Stats */}
                    <div className="flex gap-6 p-4 bg-[var(--color-page)] rounded-lg border border-[var(--color-border-theme)]">
                        <div className="flex-1 text-center border-r border-[var(--color-border-theme)] last:border-0">
                            <div className="text-xs text-[var(--color-muted)] uppercase mb-1">时长</div>
                            <div className="font-bold text-[var(--color-main)]">{selectedRecipe.total_time_minutes}m</div>
                        </div>
                        <div className="flex-1 text-center border-r border-[var(--color-border-theme)] last:border-0">
                            <div className="text-xs text-[var(--color-muted)] uppercase mb-1">难度</div>
                            <div className="font-bold text-[var(--color-main)]">
                                {DIFFICULTIES.find(d => d.value === selectedRecipe.difficulty)?.label || selectedRecipe.difficulty}
                            </div>
                        </div>
                        <div className="flex-1 text-center">
                            <div className="text-xs text-[var(--color-muted)] uppercase mb-1">菜系</div>
                            <div className="font-bold text-[var(--color-main)]">
                                {CUISINES.find(c => c.value === selectedRecipe.cuisine)?.label || selectedRecipe.cuisine || '通用'}
                            </div>
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div>
                        <h3 className="font-bold text-[var(--color-main)] mb-3 flex items-center gap-2">
                            <Utensils className="h-4 w-4 text-[var(--color-accent)]" />
                            所需食材
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {selectedRecipe.ingredients?.map((ing, i) => (
                                <div key={i} className="flex justify-between items-center p-2 rounded bg-[var(--color-page)] text-sm border border-[var(--color-border-theme)]">
                                    <span className="text-[var(--color-main)]">{ing.name}</span>
                                    <span className="text-[var(--color-muted)]">{ing.amount} {ing.unit}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Steps Preview */}
                    <div>
                        <h3 className="font-bold text-[var(--color-main)] mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-[var(--color-accent)]" />
                            烹饪步骤 ({selectedRecipe.steps?.length || 0})
                        </h3>
                        <div className="space-y-3">
                            {selectedRecipe.steps?.sort((a: any, b: any) => a.step_order - b.step_order).map((step: any, i: number) => (
                                <div key={i} className="flex gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[var(--color-accent-light)]/20 text-[var(--color-accent)] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                                        {step.instruction}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-[var(--color-border-theme)] bg-[var(--color-page)] flex justify-end gap-3">
                    <button 
                        onClick={() => setSelectedRecipe(null)}
                        className="px-4 py-2 text-sm font-bold text-[var(--color-muted)] hover:bg-[var(--color-card)] rounded-lg transition-colors"
                    >
                        关闭
                    </button>
                    {selectedRecipe.author_id !== userId && (
                        <button 
                            onClick={() => handleImport(selectedRecipe)}
                            disabled={!!importingId}
                            className="px-6 py-2 bg-[var(--color-accent)] text-white text-sm font-bold rounded-lg shadow-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {importingId === selectedRecipe.id ? (
                                "导入中..."
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    导入到我的厨房
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </main>
  )
}
