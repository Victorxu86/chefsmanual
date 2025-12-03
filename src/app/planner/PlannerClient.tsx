"use client"

import { useState, useMemo } from "react"
import { KitchenScheduler, ScheduledBlock } from "@/lib/scheduler"
import { ChefHat, Play, Check } from "lucide-react"

export function PlannerClient({ recipes }: { recipes: any[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  const toggleRecipe = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // 核心调度计算
  const timeline = useMemo(() => {
    if (selectedIds.size === 0) return []
    
    const selectedRecipes = recipes.filter(r => selectedIds.has(r.id))
    // Transform db steps to scheduler format if needed (already matches mostly)
    const schedulerRecipes = selectedRecipes.map(r => ({
      id: r.id,
      steps: r.recipe_steps
    }))

    const scheduler = new KitchenScheduler()
    return scheduler.schedule(schedulerRecipes)
  }, [selectedIds, recipes])

  // 视觉计算
  const totalDuration = timeline.length > 0 
    ? Math.max(...timeline.map(b => b.endTime)) 
    : 0
  
  // 像素比例：1秒 = ? px
  const pxPerSec = totalDuration > 3600 ? 0.2 : 0.5 

  return (
    <main className="max-w-[1600px] mx-auto px-4 py-8 flex gap-8 h-[calc(100vh-64px)]">
      
      {/* Left Sidebar: Selection */}
      <div className="w-80 flex-shrink-0 bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border-theme)]">
          <h2 className="font-bold text-[var(--color-main)]">选择菜谱</h2>
          <p className="text-xs text-[var(--color-muted)]">勾选需要同时烹饪的菜肴</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {recipes.map(r => (
            <div 
              key={r.id}
              onClick={() => toggleRecipe(r.id)}
              className={`
                p-3 rounded-[var(--radius-theme)] border cursor-pointer transition-all flex items-center justify-between
                ${selectedIds.has(r.id) 
                  ? 'bg-[var(--color-accent-light)]/30 border-[var(--color-accent)]' 
                  : 'bg-[var(--color-page)] border-transparent hover:border-[var(--color-border-theme)]'}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Mini Cover */}
                <div className="w-10 h-10 rounded bg-[var(--color-accent-light)] overflow-hidden flex-shrink-0">
                  {r.cover_image && <img src={r.cover_image} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--color-main)] line-clamp-1">{r.title}</h4>
                  <span className="text-[10px] text-[var(--color-muted)]">{r.total_time_minutes}m</span>
                </div>
              </div>
              {selectedIds.has(r.id) && <Check className="h-4 w-4 text-[var(--color-accent)]" />}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[var(--color-border-theme)] bg-[var(--color-page)]/50">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[var(--color-muted)]">选中</span>
            <span className="font-bold">{selectedIds.size} 道菜</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-muted)]">预计总耗时</span>
            <span className="font-bold text-[var(--color-accent)]">
              {Math.ceil(totalDuration / 60)} 分钟
            </span>
          </div>
        </div>
      </div>

      {/* Main: Timeline Visualization */}
      <div className="flex-1 bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] overflow-hidden flex flex-col">
        
        {/* Toolbar */}
        <div className="h-14 border-b border-[var(--color-border-theme)] flex items-center px-4 justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-[var(--color-main)]">厨房调度视图</h2>
            {selectedIds.size > 0 && (
              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 font-mono">
                已优化
              </span>
            )}
          </div>
          <button className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-[var(--radius-theme)] text-sm font-bold flex items-center gap-2 hover:opacity-90">
            <Play className="h-4 w-4" /> 开始烹饪
          </button>
        </div>

        {/* Gantt Chart Area */}
        <div className="flex-1 overflow-auto relative bg-[var(--color-page)]">
          {selectedIds.size === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted)] opacity-50">
              <ChefHat className="h-16 w-16 mb-4" />
              <p>请在左侧选择菜谱</p>
            </div>
          ) : (
            <div className="min-w-full h-full p-8 relative">
              
              {/* Time Axis */}
              <div className="absolute top-0 left-0 right-0 h-8 border-b border-[var(--color-border-theme)] flex">
                {Array.from({ length: Math.ceil(totalDuration / 60 / 5) + 1 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute top-0 text-[10px] text-[var(--color-muted)] border-l border-[var(--color-border-theme)] pl-1 h-full"
                    style={{ left: `${i * 5 * 60 * pxPerSec}px` }}
                  >
                    {i * 5}m
                  </div>
                ))}
              </div>

              {/* Lanes */}
              <div className="mt-12 space-y-8">
                {/* Chef Lane */}
                <Lane title="👨‍🍳 厨师 (Active)" blocks={timeline.filter(b => b.step.isActive)} pxPerSec={pxPerSec} />
                
                {/* Stove Lane */}
                <Lane title="🔥 灶台 (Passive)" blocks={timeline.filter(b => !b.step.isActive && b.lane === 'stove')} pxPerSec={pxPerSec} />
                
                {/* Oven Lane */}
                <Lane title="⏲️ 烤箱/其他" blocks={timeline.filter(b => !b.step.isActive && b.lane === 'oven')} pxPerSec={pxPerSec} />
              </div>

            </div>
          )}
        </div>

      </div>
    </main>
  )
}

function Lane({ title, blocks, pxPerSec }: { title: string, blocks: ScheduledBlock[], pxPerSec: number }) {
  return (
    <div className="relative h-24 border-b border-[var(--color-border-theme)]/50">
      <div className="absolute -top-6 left-0 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">
        {title}
      </div>
      {blocks.map((block, i) => (
        <div
          key={i}
          className={`
            absolute top-2 h-16 rounded-md border flex flex-col justify-center px-2 overflow-hidden transition-all hover:scale-[1.02] hover:z-10 shadow-sm
            ${block.step.isActive 
              ? 'bg-[var(--color-card)] border-[var(--color-accent)] text-[var(--color-main)]' 
              : 'bg-[var(--color-page)] border-[var(--color-border-theme)] text-[var(--color-muted)] opacity-80'}
          `}
          style={{
            left: `${block.startTime * pxPerSec}px`,
            width: `${(block.endTime - block.startTime) * pxPerSec}px`,
            backgroundColor: block.step.recipeColor || 'white'
          }}
          title={`${block.step.instruction} (${Math.round(block.step.duration/60)}m)`}
        >
          <span className="text-xs font-bold truncate">{block.step.instruction}</span>
          <span className="text-[10px] opacity-80 truncate">{Math.round(block.step.duration/60)}m</span>
        </div>
      ))}
    </div>
  )
}

