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

  // === 智能分析：根据选中的菜谱，计算到底需要哪些工具 ===
  const needs = useMemo(() => {
    const result = {
      stove: false,
      oven: false,
      board: false,
      bowl: false
    }
    
    if (selectedIds.size === 0) return result

    // 只要选了菜，默认给一个炉头和砧板选项（防呆），或者严格检查
    result.stove = true 
    result.board = true 

    selectedIds.forEach(id => {
      const r = recipes.find(recipe => recipe.id === id)
      r?.recipe_steps.forEach((s: any) => {
        const instr = s.instruction || ""
        const equip = s.equipment || ""
        
        if (['oven', 'steamer', 'air_fryer'].includes(equip) || instr.includes('烤') || instr.includes('蒸')) {
          result.oven = true
        }
        
        if (['bowl'].includes(equip) || ['腌', '拌', '打发', '静置'].some(k => instr.includes(k))) {
          result.bowl = true
        }
      })
    })
    return result
  }, [selectedIds, recipes])

  const timeline = useMemo(() => {
    if (selectedIds.size === 0) return []
    
    const selectedRecipes = recipes.filter(r => selectedIds.has(r.id))
    const schedulerRecipes = selectedRecipes.map(r => ({
      id: r.id,
      category: r.category, // Pass category to scheduler
      steps: r.recipe_steps
    }))

    const scheduler = new KitchenScheduler(resources)
    return scheduler.schedule(schedulerRecipes)
  }, [selectedIds, recipes, resources])

  const totalDuration = timeline.length > 0 
    ? Math.max(...timeline.map(b => b.endTime)) 
    : 0
  
  const pxPerSec = totalDuration > 3600 ? 0.2 : 0.5 

  const lanes = useMemo(() => {
    const list = []
    // Chef
    for (let i = 0; i < resources.chef; i++) list.push({ id: `chef_${i+1}`, title: `👨‍🍳 厨师 #${i+1}`, icon: User })
    
    // Stove
    for (let i = 0; i < resources.stove; i++) list.push({ id: `stove_${i+1}`, title: `🔥 炉头 #${i+1}`, icon: Flame })
    
    // Oven
    for (let i = 0; i < resources.oven; i++) list.push({ id: `oven_${i+1}`, title: `⏲️ 烤箱/蒸箱 #${i+1}`, icon: Box })
    
    // Board
    for (let i = 0; i < resources.board; i++) list.push({ id: `board_${i+1}`, title: `🔪 砧板 #${i+1}`, icon: Square })
    
    // Bowl
    for (let i = 0; i < resources.bowl; i++) list.push({ id: `bowl_${i+1}`, title: `🥣 料理碗 #${i+1}`, icon: Soup })
    
    return list
  }, [resources])

  return (
    <main className="max-w-[1600px] mx-auto px-4 py-8 flex gap-8 h-[calc(100vh-64px)]">
      
      {/* Left Sidebar */}
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
                  <span className="text-[10px] text-[var(--color-muted)]">
                    {r.category ? <span className="uppercase bg-black/10 px-1 rounded mr-1">{r.category}</span> : null}
                    {r.total_time_minutes}m
                  </span>
                </div>
              </div>
              {selectedIds.has(r.id) && <Check className="h-4 w-4 text-[var(--color-accent)]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
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
                <p className="text-sm text-[var(--color-muted)]">
                  算法已分析您的菜谱，建议准备以下工具。您可以根据实际情况调整。
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-[var(--color-accent)] block">
                  预计总耗时 {Math.ceil(totalDuration / 60)} 分钟
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-8">
              <ResourceControl 
                label="可用炉头" 
                icon={<Flame className="h-5 w-5" />} 
                value={resources.stove} 
                onChange={(n: number) => setResources(p => ({...p, stove: n}))} 
                max={4} 
                color="orange" 
              />
              
              <ResourceControl 
                label="砧板数量" 
                icon={<Square className="h-5 w-5" />} 
                value={resources.board} 
                onChange={(n: number) => setResources(p => ({...p, board: n}))} 
                max={2} 
                color="green" 
              />

              {/* 新增：厨师数量配置 (Unlock Multi-Chef Mode) */}
              <ResourceControl 
                label="厨师人数" 
                icon={<User className="h-5 w-5" />} 
                value={resources.chef} 
                onChange={(n: number) => setResources(p => ({...p, chef: n}))} 
                max={4} 
                color="red" // 使用红色区分人力资源
              />

              {needs.oven && (
                <ResourceControl 
                  label="烤箱/蒸箱" 
                  icon={<Box className="h-5 w-5" />} 
                  value={resources.oven} 
                  onChange={(n: number) => setResources(p => ({...p, oven: n}))} 
                  max={2} 
                  color="blue" 
                />
              )}

              {needs.bowl && (
                <ResourceControl 
                  label="料理碗" 
                  icon={<Soup className="h-5 w-5" />} 
                  value={resources.bowl} 
                  onChange={(n: number) => setResources(p => ({...p, bowl: n}))} 
                  max={4} 
                  color="purple" 
                />
              )}
            </div>
          </div>
        )}

        {/* Bottom: Gantt Chart (Step 3) */}
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
                <div className="mt-12 space-y-6 pb-12">
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
    red: 'bg-red-100 text-red-600 border-red-300', // 新增红色样式
  }
  
  const activeColorClasses: any = {
    orange: 'bg-orange-500 hover:bg-orange-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    red: 'bg-red-500 hover:bg-red-600',
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
            const n = i; 
            if ((label === '可用炉头' || label === '砧板数量' || label === '厨师人数') && n === 0) return null;
            
            const isActive = value === n
            
            return (
              <button
                key={n}
                onClick={() => onChange(n)}
                className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold transition-all duration-200
                  ${isActive 
                    ? `${activeColorClasses[color]} text-white shadow-md transform scale-105` 
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
  return (
    <div className="relative h-20 border-b border-[var(--color-border-theme)]/50 last:border-0">
      <div className="absolute -top-5 left-0 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-2">
        {title}
        {blocks.length > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-[var(--color-border-theme)] text-[var(--color-main)] text-[10px]">
            {blocks.length} 任务
          </span>
        )}
      </div>
      
      {blocks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="h-1 w-full border-t border-dashed border-[var(--color-muted)]" />
        </div>
      )}
      
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
