"use client"

import { useState, useMemo, useEffect } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { ACTIONS, ACTION_HIERARCHY, EQUIPMENT, HEAT_LEVELS, SHAPES, ActionDefinition } from "@/lib/constants"
import { Plus, Trash2, Clock, Flame, ChevronRight, X, AlertCircle, Settings2, ChevronLeft, Home } from "lucide-react"

// ... (保留之前的 Time Steps 逻辑)
const TIME_STEPS = [
  ...Array.from({ length: 10 }, (_, i) => i + 1),
  15, 20, 25, 30, 40, 50, 60,
  ...Array.from({ length: 18 }, (_, i) => 60 + (i + 1) * 30),
  ...Array.from({ length: 4 }, (_, i) => 600 + (i + 1) * 300),
  ...Array.from({ length: 9 }, (_, i) => 1800 + (i + 1) * 600),
  ...Array.from({ length: 6 }, (_, i) => 7200 + (i + 1) * 1800),
]

const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return s > 0 ? `${m}分${s}秒` : `${m}分钟`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}小时${m}分` : `${h}小时`
}

export function Step3Timeline() {
  const { control } = useFormContext()
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "steps"
  })
  
  const ingredients = useWatch({ control, name: "ingredients" }) || []
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  
  // 动作选择器状态：当前选中的 Realm ID (一级分类)
  const [activeRealmId, setActiveRealmId] = useState<string>(ACTION_HIERARCHY[0].id)

  const handleAddStep = () => {
    append({
      step_order: fields.length + 1,
      instruction: "点击配置步骤",
      step_type: "cook",
      duration: 60,
      is_active: true,
      equipment: "wok",
      heat_level: "medium",
      _selectedIngredients: [] 
    })
    setSelectedIndex(fields.length)
  }

  const selectedStep: any = typeof selectedIndex === 'number' ? fields[selectedIndex] : null
  
  // 核心逻辑：自动生成指令文本
  const generateInstruction = (step: any, updates: any = {}) => {
    const merged = { ...step, ...updates }
    const actionKey = merged._actionKey
    // @ts-ignore
    const actionDef = ACTIONS[actionKey]
    const actionLabel = actionDef ? actionDef.label : (merged._actionLabel || "操作")
    
    const selectedIds = merged._selectedIngredients || []
    const ingredientNames = ingredients
      .filter((_: any, i: number) => selectedIds.includes(i.toString()))
      .map((i: any) => i.name)
      .join("、")
    
    if (ingredientNames) {
      return `${actionLabel} ${ingredientNames}`
    }
    return actionLabel
  }

  const updateField = (field: string, value: any) => {
    if (selectedIndex === null) return
    
    let newInstruction = selectedStep.instruction
    let extraUpdates = {}

    if (field === '_actionKey') {
      // @ts-ignore
      const def = ACTIONS[value]
      if (def) {
        // @ts-ignore
        extraUpdates.step_type = def.type
        // @ts-ignore
        extraUpdates.is_active = def.type !== 'wait'
        // @ts-ignore
        extraUpdates._actionLabel = def.label
      }
      newInstruction = generateInstruction(selectedStep, { _actionKey: value, ...extraUpdates })
    } else if (field === '_selectedIngredients') {
      newInstruction = generateInstruction(selectedStep, { _selectedIngredients: value })
    }

    // @ts-ignore
    update(selectedIndex, { 
      ...selectedStep, 
      [field]: value, 
      ...extraUpdates,
      instruction: (field === '_actionKey' || field === '_selectedIngredients') ? newInstruction : selectedStep.instruction 
    })
  }

  const getSliderIndex = (seconds: number) => {
    const idx = TIME_STEPS.findIndex(s => s >= seconds)
    return idx === -1 ? TIME_STEPS.length - 1 : idx
  }

  // 渲染右侧面板内容
  const renderActionPicker = () => {
    const currentRealm = ACTION_HIERARCHY.find(r => r.id === activeRealmId)
    
    return (
      <div className="space-y-4">
        {/* 1. Realm Tabs (一级分类) */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {ACTION_HIERARCHY.map((realm) => (
            <button
              key={realm.id}
              type="button"
              onClick={() => setActiveRealmId(realm.id)}
              className={`
                flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                ${activeRealmId === realm.id 
                  ? 'bg-[var(--color-accent)] text-white shadow-md' 
                  : 'bg-[var(--color-page)] text-[var(--color-muted)] border border-[var(--color-border-theme)] hover:border-[var(--color-accent)]'}
              `}
            >
              <span>{realm.icon}</span>
              <span>{realm.label.split('/')[0]}</span>
            </button>
          ))}
        </div>

        {/* 2. Categories & Actions (二级分类 + 动作) */}
        <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {currentRealm?.categories.map((cat) => (
            <div key={cat.id}>
              <h5 className="text-xs font-bold text-[var(--color-muted)] mb-2 flex items-center gap-2">
                <span className="w-1 h-3 bg-[var(--color-border-theme)] rounded-full" />
                {cat.label}
              </h5>
              <div className="grid grid-cols-3 gap-2">
                {cat.actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => updateField('_actionKey', action.id)}
                    className={`
                      flex flex-col items-center justify-center p-2 rounded border transition-all min-h-[60px]
                      ${selectedStep._actionKey === action.id
                        ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)] text-[var(--color-accent)] shadow-sm' 
                        : 'bg-[var(--color-page)] border-[var(--color-border-theme)] hover:border-[var(--color-accent)] hover:shadow-sm'}
                    `}
                  >
                    <span className="text-lg mb-1">{action.icon}</span>
                    <span className="text-[10px] text-center leading-tight scale-90">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 获取当前选中的 Action 定义
  // @ts-ignore
  const currentActionDef = selectedStep?._actionKey ? ACTIONS[selectedStep._actionKey] : null

  return (
    <div className="flex h-[600px] gap-6 animate-in fade-in duration-500">
      
      {/* ================== 左侧：时间轴流 ================== */}
      <div 
        className="flex-1 flex flex-col bg-[var(--color-card)] rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] overflow-hidden shadow-sm"
        onClick={() => fields.length === 0 && handleAddStep()}
      >
        <div className="p-4 border-b border-[var(--color-border-theme)] flex justify-between items-center bg-[var(--color-page)]/50">
          <h3 className="font-bold text-[var(--color-main)] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
            烹饪流程
          </h3>
          <span className="text-xs text-[var(--color-muted)]">
            {fields.length} 个步骤 · 总耗时 {formatDuration(fields.reduce((acc, s: any) => acc + (s.duration || 0), 0))}
          </span>
        </div>

        <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${fields.length === 0 ? 'cursor-pointer hover:bg-[var(--color-page)]/30 transition-colors' : ''}`}>
          {fields.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted)]">
              <div className="w-16 h-16 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center mb-4 animate-pulse">
                <Plus className="h-8 w-8 text-[var(--color-accent)]" />
              </div>
              <p className="font-bold">点击任意空白处开始</p>
              <p className="text-xs opacity-60 mt-1">添加您的第一个烹饪步骤</p>
            </div>
          )}

          {fields.map((field: any, index) => (
            <div key={field.id} className="relative pl-8 group" onClick={(e) => e.stopPropagation()}>
              {/* 连接线 */}
              {index < fields.length - 1 && (
                <div className="absolute left-[11px] top-8 bottom-[-16px] w-[2px] bg-[var(--color-border-theme)]" />
              )}
              
              {/* 节点圆点 */}
              <div 
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-all
                  ${selectedIndex === index 
                    ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white scale-110 shadow-md' 
                    : 'bg-[var(--color-page)] border-[var(--color-border-theme)] text-[var(--color-muted)] group-hover:border-[var(--color-accent)]'}
                `}
              >
                <span className="text-[10px] font-bold">{index + 1}</span>
              </div>

              {/* 卡片本体 */}
              <div 
                onClick={() => setSelectedIndex(index)}
                className={`
                  cursor-pointer rounded-lg border p-4 transition-all relative overflow-hidden
                  ${selectedIndex === index 
                    ? 'bg-[var(--color-accent-light)]/10 border-[var(--color-accent)] shadow-md ring-1 ring-[var(--color-accent)]/20' 
                    : 'bg-[var(--color-page)] border-[var(--color-border-theme)] hover:border-[var(--color-accent)]/50 hover:shadow-sm'}
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-[var(--color-main)]">
                    {field.instruction}
                  </span>
                  <div className="flex items-center gap-2">
                    {field.duration > 0 && (
                      <span className="text-xs font-mono bg-[var(--color-card)] px-1.5 py-0.5 rounded border border-[var(--color-border-theme)]">
                        {formatDuration(field.duration)}
                      </span>
                    )}
                    {selectedIndex === index && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); remove(index); setSelectedIndex(null); }}
                        className="text-[var(--color-muted)] hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {field.equipment && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      {EQUIPMENT.find(e => e.value === field.equipment)?.label}
                    </span>
                  )}
                  {field.heat_level && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1">
                      <Flame className="h-2.5 w-2.5" />
                      {HEAT_LEVELS.find(h => h.value === field.heat_level)?.label.split('/')[0]}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {fields.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleAddStep(); }}
              className="ml-8 w-[calc(100%-2rem)] py-3 rounded-lg border-2 border-dashed border-[var(--color-border-theme)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-light)]/10 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">添加下一步</span>
            </button>
          )}
        </div>
      </div>

      {/* ================== 右侧：配置面板 (Detail) ================== */}
      <div className={`
        w-96 bg-[var(--color-card)] rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] shadow-xl flex flex-col transition-all duration-300
        ${selectedIndex !== null ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0 pointer-events-none hidden'}
      `}>
        {selectedStep && (
          <>
            <div className="p-4 border-b border-[var(--color-border-theme)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--color-main)]">配置步骤 {Number(selectedIndex) + 1}</h3>
              <button onClick={() => setSelectedIndex(null)} className="text-[var(--color-muted)] hover:text-[var(--color-main)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* 1. 动作选择器 (Tabs + Grid) */}
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3 block">核心动作</label>
                {renderActionPicker()}
              </div>

              {/* 2. 动态参数 (只在选中 Action 后显示) */}
              {currentActionDef && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4 border-t border-[var(--color-border-theme)]">
                  
                  {/* 食材选择 */}
                  {(currentActionDef.params as string[]).includes("ingredients") || (currentActionDef.params as string[]).includes("ingredient") ? (
                    <div>
                      <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3 block">选择食材</label>
                      <div className="flex flex-wrap gap-2">
                        {ingredients.length > 0 ? ingredients.map((ing: any, idx: number) => {
                          const isSelected = (selectedStep._selectedIngredients || []).includes(idx.toString())
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                const current = selectedStep._selectedIngredients || []
                                const next = current.includes(idx.toString())
                                  ? current.filter((i: string) => i !== idx.toString())
                                  : [...current, idx.toString()]
                                updateField('_selectedIngredients', next)
                              }}
                              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                                isSelected 
                                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' 
                                  : 'bg-[var(--color-page)] text-[var(--color-main)] border-[var(--color-border-theme)] hover:border-[var(--color-accent)]'
                              }`}
                            >
                              {ing.name}
                            </button>
                          )
                        }) : (
                          <span className="text-sm text-[var(--color-muted)]">暂无食材</span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* 指令预览 */}
                  <div className="p-3 bg-[var(--color-page)] rounded border border-[var(--color-border-theme)]">
                    <span className="text-xs text-[var(--color-muted)] block mb-1">指令预览</span>
                    <p className="text-sm font-bold text-[var(--color-main)]">
                      {selectedStep.instruction}
                    </p>
                  </div>

                  {/* 时长滑块 */}
                  <div>
                    <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3 block">耗时</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="range" 
                        min="0" 
                        max={TIME_STEPS.length - 1} 
                        step="1"
                        value={getSliderIndex(selectedStep.duration)}
                        onChange={(e) => updateField('duration', TIME_STEPS[e.target.valueAsNumber])}
                        className="w-full accent-[var(--color-accent)]"
                      />
                      <div className="flex justify-between text-xs text-[var(--color-muted)] font-mono">
                        <span>1s</span>
                        <span className="text-[var(--color-accent)] font-bold text-base">
                          {formatDuration(selectedStep.duration)}
                        </span>
                        <span>5h</span>
                      </div>
                    </div>
                  </div>

                  {/* 环境配置 (根据 params 显示) */}
                  <div className="grid grid-cols-2 gap-4">
                    {(currentActionDef.params as string[]).includes("tool") && (
                      <div>
                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 block">设备</label>
                        <select
                          value={selectedStep.equipment || ""}
                          onChange={(e) => updateField('equipment', e.target.value)}
                          className="w-full px-3 py-2 rounded bg-[var(--color-page)] border border-[var(--color-border-theme)] text-sm"
                        >
                          <option value="">选择...</option>
                          {EQUIPMENT.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                      </div>
                    )}
                    {(currentActionDef.params as string[]).includes("heat") && (
                      <div>
                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 block">火力</label>
                        <select
                          value={selectedStep.heat_level || ""}
                          onChange={(e) => updateField('heat_level', e.target.value)}
                          className="w-full px-3 py-2 rounded bg-[var(--color-page)] border border-[var(--color-border-theme)] text-sm"
                        >
                          <option value="">选择...</option>
                          {HEAT_LEVELS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          </>
        )}
      </div>

    </div>
  )
}
