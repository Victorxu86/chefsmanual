"use client"

import { useState, useMemo } from "react"
import { KitchenScheduler, ScheduledBlock } from "@/lib/scheduler"
import { ChefHat, Play, Check, Settings, Flame, Mic, Box, Clock, Square, Soup, User } from "lucide-react"

export function SessionClient({ recipes }: { recipes: any[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  const [resources, setResources] = useState({
    stove: 2,
    oven: 1,
    chef: 1,
    board: 1,
    bowl: 2
  })

  const toggleRecipe = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const timeline = useMemo(() => {
    if (selectedIds.size === 0) return []
    
    const selectedRecipes = recipes.filter(r => selectedIds.has(r.id))
    const schedulerRecipes = selectedRecipes.map(r => ({
      id: r.id,
      steps: r.recipe_steps
    }))

    const scheduler = new KitchenScheduler(resources)
    return scheduler.schedule(schedulerRecipes)
  }, [selectedIds, recipes, resources])

  const totalDuration = timeline.length > 0 
    ? Math.max(...timeline.map(b => b.endTime)) 
    : 0
  
  const pxPerSec = totalDuration > 3600 ? 0.2 : 0.5 

  // 动态生成泳道配置
  const lanes = useMemo(() => {
    const list = []
    // Chef Lanes
    for (let i = 0; i < resources.chef; i++) list.push({ id: `chef_${i+1}`, title: `👨‍🍳 厨师 #${i+1}`, icon: User })
    // Stove Lanes
    for (let i = 0; i < resources.stove; i++) list.push({ id: `stove_${i+1}`, title: `🔥 灶台 #${i+1}`, icon: Flame })
    // Oven Lanes
    for (let i = 0; i < resources.oven; i++) list.push({ id: `oven_${i+1}`, title: `⏲️ 烤箱 #${i+1}`, icon: Box })
    // Board Lanes
    for (let i = 0; i < resources.board; i++) list.push({ id: `board_${i+1}`, title: `🔪 砧板 #${i+1}`, icon: Square })
    // Bowl Lanes (Optional, maybe hide if too many?)
    // for (let i = 0; i < resources.bowl; i++) list.push({ id: `bowl_${i+1}`, title: `🥣 料理碗 #${i+1}`, icon: Soup })
    return list
  }, [resources])

  return (
    <main className="max-w-[1600px] mx-auto px-4 py-8 flex gap-8 h-[calc(100vh-64px)]">
      
      {/* Left Sidebar */}
      <div className="w-80 flex-shrink-0 bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] flex flex-col">
        {/* ... Keep existing sidebar code ... */}
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

      {/* Main */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Resource Config */}
        {selectedIds.size > 0 && (
          <div className="bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] p-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-bold text-[var(--color-main)] flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  第二步：确认厨房资源
                </h2>
                <p className="text-sm text-[var(--color-muted)]">算法将根据您的设备数量优化并行策略。</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[var(--color-accent)] block">
                  预计总耗时 {Math.ceil(totalDuration / 60)} 分钟
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-8">
              <ResourceControl label="可用炉头" icon={<Flame className="h-5 w-5" />} value={resources.stove} onChange={(n: number) => setResources(p => ({...p, stove: n}))} max={4} color="orange" />
              <ResourceControl label="烤箱/蒸箱" icon={<Box className="h-5 w-5" />} value={resources.oven} onChange={(n: number) => setResources(p => ({...p, oven: n}))} max={2} color="blue" />
              <ResourceControl label="砧板数量" icon={<Square className="h-5 w-5" />} value={resources.board} onChange={(n: number) => setResources(p => ({...p, board: n}))} max={2} color="green" />
              <ResourceControl label="料理碗" icon={<Soup className="h-5 w-5" />} value={resources.bowl} onChange={(n: number) => setResources(p => ({...p, bowl: n}))} max={4} color="purple" />
            </div>
          </div>
        )}

        {/* Gantt Chart */}
        <div className="flex-1 bg-[var(--color-card)] border border-[var(--color-border-theme)] rounded-[var(--radius-theme)] overflow-hidden flex flex-col relative">
          <div className="h-14 border-b border-[var(--color-border-theme)] flex items-center px-4 justify-between bg-[var(--color-card)] z-10">
            <h2 className="font-bold text-[var(--color-main)]">第三步：智能调度预览</h2>
            <button 
              disabled={selectedIds.size === 0}
              className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-full text-sm font-bold flex items-center gap-2 hover:opacity-90 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              <Play className="h-4 w-4" /> 开始烹饪导航
            </button>
          </div>

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
                <div className="mt-12 space-y-6">
                  {lanes.map(lane => (
                    <Lane 
                      key={lane.id} 
                      title={lane.title} 
                      blocks={timeline.filter(b => b.resourceId === lane.id)} 
                      pxPerSec={pxPerSec} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function ResourceControl({ label, icon, value, onChange, max, color }: any) {
  const colorClasses: any = {
    orange: 'bg-orange-100 text-orange-600 border-orange-300',
    blue: 'bg-blue-100 text-blue-600 border-blue-300',
    green: 'bg-green-100 text-green-600 border-green-300',
    purple: 'bg-purple-100 text-purple-600 border-purple-300',
  }
  
  return (
    <div className="flex items-center gap-4 p-3 rounded bg-[var(--color-page)] border border-[var(--color-border-theme)]">
      <div className={`p-2 rounded-full ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]}`}>
        {icon}
      </div>
      <div>
        <label className="text-xs font-bold text-[var(--color-muted)] block mb-1">{label}</label>
        <div className="flex gap-2">
          {Array.from({length: max + 1}).map((_, i) => {
            const n = i; // 0 to max
            if (label !== '烤箱/蒸箱数量' && n === 0) return null; // 炉头/砧板至少1个
            return (
              <button
                key={n}
                onClick={() => onChange(n)}
                className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-all
                  ${value === n 
                    ? `${colorClasses[color].split(' ')[0].replace('100', '500')} text-white shadow-md` 
                    : `bg-white text-[var(--color-main)] border border-[var(--color-border-theme)] hover:border-${color}-300`}
                `}
              >
                {n}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Lane({ title, blocks, pxPerSec }: { title: string, blocks: ScheduledBlock[], pxPerSec: number }) {
  if (blocks.length === 0) return null // Hide empty lanes to save space? Or show for clarity? Let's hide.

  return (
    <div className="relative h-20 border-b border-[var(--color-border-theme)]/50 last:border-0">
      <div className="absolute -top-5 left-0 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-2">
        {title}
      </div>
      {blocks.map((block, i) => (
        <div
          key={i}
          className={`
            absolute top-1 h-14 rounded-md border flex flex-col justify-center px-2 overflow-hidden transition-all hover:scale-[1.02] hover:z-10 shadow-sm cursor-pointer group
            ${block.step.isActive 
              ? 'bg-[var(--color-card)] border-[var(--color-accent)] text-[var(--color-main)] ring-1 ring-[var(--color-accent)]/20' 
              : 'bg-[var(--color-page)] border-[var(--color-border-theme)] text-[var(--color-muted)] opacity-90'}
          `}
          style={{
            left: `${block.startTime * pxPerSec}px`,
            width: `${(block.endTime - block.startTime) * pxPerSec}px`,
            backgroundColor: block.step.recipeColor || 'white',
          }}
          title={`${block.step.instruction} (${Math.round(block.step.duration/60)}m)`}
        >
          <span className="text-xs font-bold truncate">{block.step.instruction}</span>
          <span className="text-[10px] opacity-80 font-mono">{Math.round(block.step.duration/60)}m</span>
        </div>
      ))}
    </div>
  )
}
