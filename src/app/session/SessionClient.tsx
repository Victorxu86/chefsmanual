"use client"

import { useState, useMemo } from "react"
import { KitchenScheduler, ScheduledBlock } from "@/lib/scheduler"
import { ChefHat, Play, Check, Settings, Flame, Mic, Box, Clock } from "lucide-react"

export function SessionClient({ recipes }: { recipes: any[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // 资源配置状态 (默认值)
  const [resources, setResources] = useState({
    stove: 2,
    oven: 1,
    chef: 1,
    // 可以在这里扩展更多设备：blender: 1, etc.
  })

  const toggleRecipe = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  // 计算所需的理论最大资源 (用于提示用户)
  const requiredResources = useMemo(() => {
    // 这是一个简单的估算，实际需要遍历所有步骤看并发
    // 这里我们只统计涉及到的设备类型
    const req = { stove: 0, oven: 0 }
    selectedIds.forEach(id => {
      const r = recipes.find(recipe => recipe.id === id)
      r?.recipe_steps.forEach((s: any) => {
        if (['wok', 'pan', 'pot', 'pressure_cooker'].includes(s.equipment)) req.stove = Math.max(req.stove, 1) // 至少需要1个，具体并发由算法算
        if (['oven', 'steamer'].includes(s.equipment)) req.oven = Math.max(req.oven, 1)
      })
    })
    return req
  }, [selectedIds, recipes])

  // 核心调度计算
  const timeline = useMemo(() => {
    if (selectedIds.size === 0) return []
    
    const selectedRecipes = recipes.filter(r => selectedIds.has(r.id))
    const schedulerRecipes = selectedRecipes.map(r => ({
      id: r.id,
      steps: r.recipe_steps
    }))

    // 将用户配置的资源传入调度器
    const scheduler = new KitchenScheduler(resources)
    return scheduler.schedule(schedulerRecipes)
  }, [selectedIds, recipes, resources])

  // 视觉计算
  const totalDuration = timeline.length > 0 
    ? Math.max(...timeline.map(b => b.endTime)) 
    : 0
  
  const pxPerSec = totalDuration > 3600 ? 0.2 : 0.5 

  return (
    <main className="max-w-[1600px] mx-auto px-4 py-8 flex gap-8 h-[calc(100vh-64px)]">
      
      {/* Left Sidebar: Recipe Selection */}
      <div className="w-80 flex-shrink-0 bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] flex flex-col">
        <div className="p-4 border-b border-[var(--color-border-theme)]">
          <h2 className="font-bold text-[var(--color-main)]">第一步：选择菜谱</h2>
          <p className="text-xs text-[var(--color-muted)]">勾选您今天要做的菜</p>
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
      </div>

      {/* Main: Resource Check & Timeline */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Top: Resource Configuration (Step 2) */}
        {selectedIds.size > 0 && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] p-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold text-[var(--color-main)] flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  第二步：确认厨房资源
                </h2>
                <p className="text-sm text-[var(--color-muted)]">告诉算法您有哪些设备，我们将为您优化并行策略。</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[var(--color-accent)] block">
                  预计总耗时 {Math.ceil(totalDuration / 60)} 分钟
                </span>
                <span className="text-xs text-[var(--color-muted)]">
                  (单线程耗时 {Math.ceil(recipes.filter(r => selectedIds.has(r.id)).reduce((acc, r) => acc + r.total_time_minutes, 0))} 分钟)
                </span>
              </div>
            </div>

            <div className="flex gap-8">
              {/* Stove Config */}
              <div className="flex items-center gap-4 p-3 rounded bg-[var(--color-page)] border border-[var(--color-border-theme)]">
                <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                  <Flame className="h-5 w-5" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">可用炉头数量</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        onClick={() => setResources(prev => ({ ...prev, stove: n }))}
                        className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-all
                          ${resources.stove === n 
                            ? 'bg-orange-500 text-white shadow-md' 
                            : 'bg-white text-[var(--color-main)] border border-[var(--color-border-theme)] hover:border-orange-300'}
                        `}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Oven Config */}
              <div className="flex items-center gap-4 p-3 rounded bg-[var(--color-page)] border border-[var(--color-border-theme)]">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">烤箱/蒸箱数量</label>
                  <div className="flex gap-2">
                    {[0, 1, 2].map(n => (
                      <button
                        key={n}
                        onClick={() => setResources(prev => ({ ...prev, oven: n }))}
                        className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-all
                          ${resources.oven === n 
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'bg-white text-[var(--color-main)] border border-[var(--color-border-theme)] hover:border-blue-300'}
                        `}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom: Gantt Chart (Step 3) */}
        <div className="flex-1 bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] overflow-hidden flex flex-col relative">
          
          {/* Toolbar */}
          <div className="h-14 border-b border-[var(--color-border-theme)] flex items-center px-4 justify-between bg-[var(--color-card)] z-10">
            <h2 className="font-bold text-[var(--color-main)]">第三步：智能调度预览</h2>
            <button 
              disabled={selectedIds.size === 0}
              className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-full text-sm font-bold flex items-center gap-2 hover:opacity-90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              <Play className="h-4 w-4" /> 开始烹饪导航
            </button>
          </div>

          {/* Gantt Chart Area */}
          <div className="flex-1 overflow-auto relative bg-[var(--color-page)]">
            {selectedIds.size === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted)] opacity-50">
                <ChefHat className="h-16 w-16 mb-4" />
                <p>请先在左侧选择菜谱</p>
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
                  
                  {/* Stove Lanes - Dynamic based on resources */}
                  {Array.from({ length: resources.stove }).map((_, i) => (
                    <Lane 
                      key={`stove_${i}`} 
                      title={`🔥 灶台 #${i + 1}`} 
                      // 这里需要算法支持分配具体的 stove_id，目前我们只分了 stove_any
                      // 临时逻辑：如果资源足够，可以展示在同一行，或者以后优化算法分配具体的 ID
                      // 现在暂时把所有 passive stove 任务放在第一个 stove lane 里演示
                      blocks={i === 0 ? timeline.filter(b => !b.step.isActive && b.lane === 'stove') : []} 
                      pxPerSec={pxPerSec} 
                    />
                  ))}
                  
                  {/* Oven Lane */}
                  {resources.oven > 0 && (
                    <Lane title="⏲️ 烤箱/其他" blocks={timeline.filter(b => !b.step.isActive && b.lane === 'oven')} pxPerSec={pxPerSec} />
                  )}
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  )
}

function Lane({ title, blocks, pxPerSec }: { title: string, blocks: ScheduledBlock[], pxPerSec: number }) {
  return (
    <div className="relative h-24 border-b border-[var(--color-border-theme)]/50 last:border-0">
      <div className="absolute -top-6 left-0 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-2">
        {title}
        <span className="px-1.5 py-0.5 rounded bg-[var(--color-border-theme)] text-[var(--color-main)] text-[10px]">
          {blocks.length} 任务
        </span>
      </div>
      {blocks.map((block, i) => (
        <div
          key={i}
          className={`
            absolute top-2 h-16 rounded-md border flex flex-col justify-center px-3 overflow-hidden transition-all hover:scale-[1.02] hover:z-10 shadow-sm cursor-pointer group
            ${block.step.isActive 
              ? 'bg-[var(--color-card)] border-[var(--color-accent)] text-[var(--color-main)]' 
              : 'bg-[var(--color-page)] border-[var(--color-border-theme)] text-[var(--color-muted)] opacity-90'}
          `}
          style={{
            left: `${block.startTime * pxPerSec}px`,
            width: `${(block.endTime - block.startTime) * pxPerSec}px`,
            backgroundColor: block.step.recipeColor || 'white',
            borderColor: block.step.isActive ? 'var(--color-accent)' : 'transparent'
          }}
          title={`${block.step.instruction} (${Math.round(block.step.duration/60)}m)`}
        >
          <span className="text-xs font-bold truncate group-hover:whitespace-normal">{block.step.instruction}</span>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] opacity-80 font-mono">{Math.round(block.step.duration/60)}m</span>
            {!block.step.isActive && <Clock className="h-3 w-3 opacity-50" />}
          </div>
        </div>
      ))}
    </div>
  )
}
