"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock, Flame, ChefHat, Users, Play, Calendar } from "lucide-react"
import { DashboardHeader } from "@/components/DashboardHeader"
import { EQUIPMENT, HEAT_LEVELS } from "@/lib/constants"
import { KitchenScheduler } from "@/lib/scheduler"

// Helper to format duration
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  return `${m}m`
}

export function RecipeDetailClient({ recipe }: { recipe: any }) {
  const router = useRouter()
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())

  const toggleIngredient = (id: string) => {
    const next = new Set(checkedIngredients)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setCheckedIngredients(next)
  }

  const handleStartCooking = () => {
    // Default resources
    const resources = {
      stove: 2,
      oven: 1,
      chef: 1,
      board: 1,
      bowl: 2
    }

    const scheduler = new KitchenScheduler(resources, 'relaxed')
    const timeline = scheduler.schedule([{
         id: recipe.id,
         title: recipe.title,
         category: recipe.category,
         steps: recipe.recipe_steps
    }])

    const sessionData = {
      timeline,
      resources,
      recipes: [{
         id: recipe.id,
         title: recipe.title,
         cover_image: recipe.cover_image
      }],
      startedAt: Date.now(),
      mode: 'relaxed'
    }

    localStorage.setItem('cooking_session', JSON.stringify(sessionData))
    router.push('/session/live')
  }

  const handleAddToPlan = () => {
     router.push('/plan')
  }

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail="" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb */}
        <Link 
          href="/recipes" 
          className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-main)] mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 返回列表
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ============ Left Column: Meta & Ingredients ============ */}
          <div className="space-y-8">
            
            {/* Recipe Card */}
            <div className="bg-[var(--color-card)] rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] overflow-hidden">
              <div className="aspect-video bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)] relative">
                <ChefHat className="h-16 w-16 opacity-20" />
                {recipe.cover_image && <img src={recipe.cover_image} className="absolute inset-0 w-full h-full object-cover" />}
              </div>
              
              <div className="p-6 space-y-4">
                <h1 className="text-2xl font-bold text-[var(--color-main)]">{recipe.title}</h1>
                <p className="text-[var(--color-muted)] text-sm leading-relaxed">
                  {recipe.description || "暂无描述"}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-[var(--color-muted)] pt-4 border-t border-[var(--color-border-theme)]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{recipe.total_time_minutes}m</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-4 w-4" />
                    <span className="capitalize">{recipe.difficulty}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{recipe.servings}人</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredients Checklist */}
            <div className="bg-[var(--color-card)] rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] p-6">
              <h3 className="font-bold text-[var(--color-main)] mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-[var(--color-accent)] rounded-full" />
                食材清单
              </h3>
              <div className="space-y-2">
                {recipe.recipe_ingredients.map((ing: any) => (
                  <div 
                    key={ing.id} 
                    onClick={() => toggleIngredient(ing.id)}
                    className={`
                      flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all
                      ${checkedIngredients.has(ing.id) ? 'bg-[var(--color-page)] opacity-50' : 'hover:bg-[var(--color-page)]'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                        ${checkedIngredients.has(ing.id) ? 'bg-[var(--color-accent)] border-[var(--color-accent)]' : 'border-[var(--color-muted)]'}
                      `}>
                        {checkedIngredients.has(ing.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className={checkedIngredients.has(ing.id) ? 'line-through' : ''}>
                        {ing.name}
                      </span>
                    </div>
                    <span className="text-sm text-[var(--color-muted)] font-mono">
                      {ing.amount} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button 
                onClick={handleStartCooking}
                className="w-full py-3 rounded-[var(--radius-theme)] bg-[var(--color-accent)] text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <Play className="h-5 w-5" /> 开始烹饪导航
              </button>
              <button 
                onClick={handleAddToPlan}
                className="w-full py-3 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] text-[var(--color-main)] font-bold hover:bg-[var(--color-page)] transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="h-5 w-5" /> 加入计划
              </button>
            </div>

          </div>

          {/* ============ Right Column: Timeline ============ */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--color-card)] rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] p-8 min-h-[600px]">
              <h3 className="font-bold text-[var(--color-main)] mb-8 flex items-center justify-between">
                <span>烹饪流程图</span>
                <span className="text-xs font-normal text-[var(--color-muted)] bg-[var(--color-page)] px-2 py-1 rounded">
                  总计 {recipe.recipe_steps.length} 步
                </span>
              </h3>

              <div className="relative pl-8 space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[var(--color-border-theme)]">
                {recipe.recipe_steps.map((step: any, index: number) => (
                  <div key={step.id} className="relative">
                    {/* Time Marker */}
                    <div className={`
                      absolute -left-[41px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 bg-[var(--color-card)]
                      ${step.is_active ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-muted)] text-[var(--color-muted)]'}
                    `}>
                      <span className="text-[10px] font-bold">{index + 1}</span>
                    </div>

                    {/* Step Card */}
                    <div className={`
                      rounded-lg border p-5 transition-all hover:shadow-md
                      ${step.is_active 
                        ? 'bg-[var(--color-accent-light)]/10 border-[var(--color-accent)]/30' 
                        : 'bg-[var(--color-page)] border-[var(--color-border-theme)] opacity-80'}
                    `}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-[var(--color-main)] text-lg">{step.instruction}</h4>
                        <span className="font-mono text-xs font-bold bg-white/50 px-2 py-1 rounded">
                          {formatDuration(step.duration_seconds)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide font-bold
                          ${step.step_type === 'prep' ? 'bg-blue-100 text-blue-700' : 
                            step.step_type === 'cook' ? 'bg-orange-100 text-orange-700' : 
                            step.step_type === 'wait' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}
                        `}>
                          {step.step_type}
                        </span>
                        
                        {step.equipment && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[var(--color-border-theme)] text-[var(--color-muted)] flex items-center gap-1">
                            🔧 {EQUIPMENT.find(e => e.value === step.equipment)?.label || step.equipment}
                          </span>
                        )}
                        
                        {step.heat_level && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-[var(--color-border-theme)] text-[var(--color-muted)] flex items-center gap-1">
                            🔥 {HEAT_LEVELS.find(h => h.value === step.heat_level)?.label || step.heat_level}
                          </span>
                        )}

                        {!step.is_active && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                            ☕️ 可离开 (Passive)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

