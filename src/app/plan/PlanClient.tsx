"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Check, Play, ShoppingCart, ArrowRight, Utensils, Copy, CheckSquare } from "lucide-react"
import { RECIPE_CATEGORIES } from "@/lib/constants"

interface Ingredient {
  name: string
  amount?: string
  unit?: string
  prep_note?: string
}

interface Recipe {
  id: string
  title: string
  cover_image?: string
  category?: string
  total_time_minutes: number
  ingredients: Ingredient[]
}

export function PlanClient({ recipes }: { recipes: any[] }) {
  const router = useRouter()
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Load checked items from localStorage on mount
  useEffect(() => {
      try {
          const saved = localStorage.getItem('shopping_list_checked')
          if (saved) {
              setCheckedItems(JSON.parse(saved))
          }
      } catch (e) {
          console.error("Failed to load checked items", e)
      }
  }, [])

  const toggleItemCheck = (key: string) => {
      const next = { ...checkedItems, [key]: !checkedItems[key] }
      setCheckedItems(next)
      localStorage.setItem('shopping_list_checked', JSON.stringify(next))
  }

  const handleCopyList = () => {
      const text = shoppingList.map(group => {
          let line = `- ${group.name}`
          if (group.totalAmount) line += `: ${group.totalAmount}${group.unit || ''}`
          // Add details if needed, or keep it simple
          return line
      }).join('\n')
      
      navigator.clipboard.writeText(`🛒 采购清单 (${new Date().toLocaleDateString()}):\n${text}`)
      // Could show a toast here
      alert("清单已复制到剪贴板！")
  }

  const toggleRecipe = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // Generate Shopping List
  const shoppingList = useMemo(() => {
    const list: Record<string, { name: string, items: any[], totalAmount?: number, unit?: string }> = {}
    
    selectedIds.forEach(id => {
      const recipe = recipes.find(r => r.id === id)
      if (recipe?.ingredients) {
        recipe.ingredients.forEach((ing: Ingredient) => {
          const key = ing.name.trim()
          if (!list[key]) {
              list[key] = { name: key, items: [], totalAmount: 0, unit: ing.unit }
          }
          
          // Try to parse amount
          let amountVal = 0
          if (ing.amount) {
              const parsed = parseFloat(ing.amount)
              if (!isNaN(parsed)) amountVal = parsed
          }

          // Add to total if unit matches (simple check)
          if (list[key].unit === ing.unit) {
              list[key].totalAmount = (list[key].totalAmount || 0) + amountVal
          } else {
              // Unit mismatch, maybe reset total or handle complex conversion
              // For now, if units differ, we don't sum totals perfectly
              // Just keep items
          }

          list[key].items.push({
            ...ing,
            _recipeTitle: recipe.title
          })
        })
      }
    })
    
    return Object.values(list).sort((a, b) => a.name.localeCompare(b.name))
  }, [selectedIds, recipes])

  const handleStartCooking = () => {
    // In reality, we might want to pass the selected IDs to session page via query param or store
    // For now, we just redirect to session page where user re-selects or we can auto-select
    // Better: Store 'plan' in localStorage and let SessionClient read it?
    // Or just redirect to session page with ?recipes=id1,id2
    const params = new URLSearchParams()
    params.set('ids', Array.from(selectedIds).join(','))
    router.push(`/session?${params.toString()}`)
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 h-[calc(100vh-64px)] flex gap-8">
      
      {/* Left: Recipe Selection */}
      <div className="w-1/3 bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] flex flex-col shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-theme)] bg-[var(--color-page)]/50">
          <h2 className="font-bold text-[var(--color-main)] flex items-center gap-2 text-lg">
             <BookOpen className="h-5 w-5 text-[var(--color-accent)]" />
             选择菜谱
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-1">勾选您计划制作的菜肴</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {recipes.map(r => (
            <div 
              key={r.id}
              onClick={() => toggleRecipe(r.id)}
              className={`
                p-3 rounded-[var(--radius-theme)] border cursor-pointer transition-all flex items-center justify-between group
                ${selectedIds.has(r.id) 
                  ? 'bg-[var(--color-accent-light)]/20 border-[var(--color-accent)]' 
                  : 'bg-[var(--color-page)] border-transparent hover:border-[var(--color-border-theme)]'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded bg-[var(--color-accent-light)] overflow-hidden flex-shrink-0 relative">
                  {r.cover_image ? (
                      <img src={r.cover_image} className="w-full h-full object-cover" />
                  ) : (
                      <Utensils className="h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--color-accent)]/50" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-main)] line-clamp-1 group-hover:text-[var(--color-accent)] transition-colors">{r.title}</h4>
                  <span className="text-[10px] text-[var(--color-muted)] flex items-center gap-2 mt-1">
                    {r.category ? (
                        <span className="uppercase bg-black/5 px-1.5 py-0.5 rounded font-medium">
                            {RECIPE_CATEGORIES.find(c => c.value === r.category)?.label.split(' ')[0] || r.category}
                        </span>
                    ) : null}
                    {r.total_time_minutes}m
                  </span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedIds.has(r.id) ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border-theme)]'}`}>
                  {selectedIds.has(r.id) && <Check className="h-3 w-3 text-white" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Planning & Shopping List */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Summary Header */}
        <div className="bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] p-6 flex justify-between items-center shadow-sm">
            <div>
                <h1 className="text-2xl font-bold text-[var(--color-main)] mb-1">备料与采购计划</h1>
                <p className="text-[var(--color-muted)]">
                    已选择 <span className="font-bold text-[var(--color-accent)]">{selectedIds.size}</span> 道菜 • 
                    共计 <span className="font-bold text-[var(--color-accent)]">{shoppingList.length}</span> 种食材
                </p>
            </div>
            <div className="flex gap-3">
                {/* Primary Action: Proceed to Cook */}
                <button 
                    onClick={handleStartCooking}
                    disabled={selectedIds.size === 0}
                    className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-[var(--radius-theme)] font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:transform-none flex items-center gap-2"
                >
                    <Utensils className="h-5 w-5" />
                    前往烹饪
                </button>
            </div>
        </div>

        {/* List Tabs */}
        <div className="flex gap-4 border-b border-[var(--color-border-theme)] px-2">
            <button className="px-4 py-2 text-sm font-bold text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]">
                采购清单 (Shopping)
            </button>
            <button className="px-4 py-2 text-sm font-bold text-[var(--color-muted)] hover:text-[var(--color-main)] opacity-50 cursor-not-allowed" title="即将推出">
                备料清单 (Prep)
            </button>
        </div>

        {/* Shopping List */}
        <div className="flex-1 bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] flex flex-col shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border-theme)] bg-[var(--color-page)]/50 flex justify-between items-center">
                <h3 className="font-bold text-[var(--color-main)] flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-[var(--color-accent)]" />
                    智能购物清单
                </h3>
                {selectedIds.size > 0 && (
                    <span className="text-xs text-[var(--color-muted)] bg-[var(--color-border-theme)]/50 px-2 py-1 rounded">
                        自动合并同类项
                    </span>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
                {selectedIds.size === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-[var(--color-muted)] opacity-50">
                        <ShoppingCart className="h-16 w-16 mb-4 stroke-1" />
                        <p>请先在左侧选择菜谱</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shoppingList.map((group, idx) => {
                            const isChecked = checkedItems[group.name] || false
                            
                            return (
                            <div key={idx} className={`p-4 rounded-lg border transition-all ${isChecked ? 'bg-[var(--color-page)] border-[var(--color-border-theme)] opacity-60' : 'bg-[var(--color-card)] border-[var(--color-border-theme)] hover:border-[var(--color-accent)]/50 shadow-sm'}`}>
                                <div className="flex justify-between items-start mb-2 cursor-pointer" onClick={() => toggleItemCheck(group.name)}>
                                    <div className="flex flex-col">
                                        <span className={`font-bold text-lg transition-colors ${isChecked ? 'text-[var(--color-muted)] line-through decoration-2' : 'text-[var(--color-main)]'}`}>{group.name}</span>
                                        {group.totalAmount && group.totalAmount > 0 && (
                                            <span className={`text-xs font-bold ${isChecked ? 'text-[var(--color-muted)]' : 'text-[var(--color-accent)]'}`}>
                                                总计: {group.totalAmount} {group.unit}
                                            </span>
                                        )}
                                    </div>
                                    <div className={`flex items-center justify-center w-6 h-6 rounded border transition-all ${isChecked ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-border-theme)] bg-[var(--color-page)]'}`}>
                                        {isChecked && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                                <div className={`space-y-1 transition-opacity duration-300 ${isChecked ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100'}`}>
                                    {group.items.map((item: any, i) => (
                                        <div key={i} className="text-sm text-[var(--color-muted)] flex justify-between border-b border-dashed border-[var(--color-border-theme)]/50 last:border-0 py-1">
                                            <span>
                                                {item.amount} {item.unit}
                                                {item.prep_note && <span className="text-[10px] ml-1 bg-black/5 px-1 rounded">{item.prep_note}</span>}
                                            </span>
                                            <span className="text-[10px] opacity-50 truncate max-w-[100px]">{item._recipeTitle}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </div>
        </div>

      </div>
    </main>
  )
}

