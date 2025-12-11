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
  const { fields, append, remove, update, insert } = useFieldArray({
    control,
    name: "steps"
  })
  
  const ingredients = useWatch({ control, name: "ingredients" }) || []
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  
  const [activeRealmId, setActiveRealmId] = useState<string | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedIndex !== null) {
      // 可以在这里做回填逻辑
    }
  }, [selectedIndex])

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
    setActiveRealmId(ACTION_HIERARCHY[0].id)
    setActiveCategoryId(null)
  }

  const handleInsertStep = (insertIndex: number) => {
    insert(insertIndex, {
      step_order: insertIndex + 1,
      instruction: "点击配置步骤",
      step_type: "cook",
      duration: 60,
      is_active: true,
      equipment: "wok",
      heat_level: "medium",
      _selectedIngredients: [] 
    })
    setSelectedIndex(insertIndex)
    setActiveRealmId(ACTION_HIERARCHY[0].id)
    setActiveCategoryId(null)
  }

  const selectedStep: any = typeof selectedIndex === 'number' ? fields[selectedIndex] : null
  
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

  const renderActionPicker = () => {
    const currentRealm = ACTION_HIERARCHY.find(r => r.id === activeRealmId)
    const currentCategory = currentRealm?.categories.find(c => c.id === activeCategoryId)
    
    return (
      <div className="space-y-6">
        <div>
          <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 block">第一步：选择领域</label>
          <div className="flex justify-between gap-2 bg-[var(--color-page)] p-1 rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] overflow-x-auto">
            {ACTION_HIERARCHY.map((realm) => {
              const isActive = activeRealmId === realm.id
              return (
                <button
                  key={realm.id}
                  type="button"
                  onClick={() => { setActiveRealmId(realm.id); setActiveCategoryId(null); }}
                  className={`
                    flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md transition-all duration-300 relative min-w-[60px]
                    ${isActive 
                      ? 'bg-white text-[var(--color-accent)] shadow-sm scale-105 z-10' 
                      : 'text-[var(--color-muted)] hover:text-[var(--color-main)] hover:bg-black/5'}
                  `}
                >
                  <span className="text-xl mb-1">{realm.icon}</span>
                  <span className="text-[10px] font-bold scale-90 whitespace-nowrap">{realm.label.split('/')[0]}</span>
                  {isActive && <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--color-accent)]" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className={`transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${activeRealmId ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
          <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 block">第二步：选择类别</label>
          <div className="flex flex-wrap gap-2">
            {currentRealm?.categories.map((cat) => {
              const isActive = activeCategoryId === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`
                    px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border whitespace-nowrap
                    ${isActive 
                      ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-md transform -translate-y-0.5' 
                      : 'bg-[var(--color-card)] text-[var(--color-muted)] border-[var(--color-border-theme)] hover:border-[var(--color-accent)] hover:text-[var(--color-main)]'}
                  `}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className={`transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden ${activeCategoryId ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 block">第三步：具体动作</label>
          <div className="grid grid-cols-3 gap-2 pb-1">
            {currentCategory?.actions.map((action) => {
              const isSelected = selectedStep?._actionKey === action.id
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => updateField('_actionKey', action.id)}
                  className={`
                    relative py-3 px-2 rounded-[var(--radius-theme)] text-xs font-bold transition-all duration-200 border text-center
                    ${isSelected
                      ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)] text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]' 
                      : 'bg-[var(--color-card)] border-[var(--color-border-theme)] text-[var(--color-main)] hover:border-[var(--color-accent)] hover:bg-[var(--color-page)]'}
                  `}
                >
                  {action.label}
                  {isSelected && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]" />}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // @ts-ignore
  const currentActionDef = selectedStep?._actionKey ? ACTIONS[selectedStep._actionKey] : null
  
  // 安全获取 params 数组
  const currentParams = useMemo(() => {
    if (!currentActionDef || !Array.isArray(currentActionDef.params)) return []
    return currentActionDef.params as string[]
  }, [currentActionDef])

  return (
    <div className="flex flex-col md:flex-row h-[600px] gap-6 animate-in fade-in duration-500 relative">
      
      {/* ================== 左侧：时间轴流 (Master) ================== */}
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
                <>
                  <div className="absolute left-[11px] top-8 bottom-[-16px] w-[2px] bg-[var(--color-border-theme)]" />
                  
                  {/* 插入按钮区域 */}
                  <div className="absolute left-0 right-0 -bottom-6 h-8 flex items-center justify-center z-20 group/insert">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleInsertStep(index + 1);
                      }}
                      className="opacity-0 group-hover/insert:opacity-100 transition-all duration-200 bg-[var(--color-card)] border border-[var(--color-accent)] text-[var(--color-accent)] text-[10px] px-3 py-0.5 rounded-full shadow-sm flex items-center gap-2 transform scale-95 hover:scale-105 hover:shadow-md cursor-pointer"
                    >
                      <span className="opacity-30 tracking-tighter">-----</span> 
                      <Plus className="h-3 w-3 stroke-[3px]" /> 
                      <span className="opacity-30 tracking-tighter">-----</span>
                    </button>
                  </div>
                </>
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
      {/* Mobile: Bottom Sheet (Fixed) | Desktop: Side Panel (Relative) */}
      <div className={`
        fixed inset-x-0 bottom-0 z-50 bg-[var(--color-card)] rounded-t-2xl shadow-2xl border-t border-[var(--color-border-theme)] flex flex-col transition-transform duration-300
        md:relative md:inset-auto md:w-96 md:rounded-[var(--radius-theme)] md:border md:shadow-xl md:translate-y-0
        ${selectedIndex !== null ? 'translate-y-0' : 'translate-y-full md:translate-x-10 md:opacity-0 md:pointer-events-none md:hidden'}
        h-[80vh] md:h-auto
      `}>
        {selectedStep && (
          <>
            <div className="p-4 border-b border-[var(--color-border-theme)] flex justify-between items-center">
              <h3 className="font-bold text-[var(--color-main)]">配置步骤 {Number(selectedIndex) + 1}</h3>
              <button onClick={() => setSelectedIndex(null)} className="text-[var(--color-muted)] hover:text-[var(--color-main)]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24 md:pb-6">
              
              {/* 1. 动作选择器 */}
              {renderActionPicker()}

              {/* 2. 动态参数 */}
              {currentActionDef && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4 border-t border-[var(--color-border-theme)]">
                  
                  {/* 食材选择 */}
                  {currentParams.includes("ingredients") || currentParams.includes("ingredient") ? (
                    <div>
                      <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 block">选择食材</label>
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
                              className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                                isSelected 
                                  ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)] shadow-sm' 
                                  : 'bg-[var(--color-page)] text-[var(--color-main)] border-[var(--color-border-theme)] hover:border-[var(--color-accent)]'
                              }`}
                            >
                              {ing.name}
                            </button>
                          )
                        }) : (
                          <span className="text-xs text-[var(--color-muted)]">暂无食材</span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* 指令预览 */}
                  <div className="p-3 bg-[var(--color-page)]/50 rounded border border-[var(--color-border-theme)]">
                    <span className="text-[10px] text-[var(--color-muted)] uppercase tracking-wider block mb-1">预览</span>
                    <p className="text-sm font-bold text-[var(--color-main)]">
                      {selectedStep.instruction}
                    </p>
                  </div>

                  {/* 时长滑块 */}
                  <div>
                    <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 block">预计耗时</label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="range" 
                        min="0" 
                        max={TIME_STEPS.length - 1} 
                        step="1"
                        value={getSliderIndex(selectedStep.duration)}
                        onChange={(e) => updateField('duration', TIME_STEPS[e.target.valueAsNumber])}
                        className="w-full accent-[var(--color-accent)] cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[var(--color-muted)] font-mono">
                        <span>1s</span>
                        <span className="text-[var(--color-accent)] font-bold text-sm">
                          {formatDuration(selectedStep.duration)}
                        </span>
                        <span>5h</span>
                      </div>
                    </div>
                  </div>

                  {/* 环境配置 */}
                  <div className="grid grid-cols-2 gap-4">
                    {currentParams.includes("tool") && (
                      <div>
                        <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 block">设备</label>
                        <select
                          value={selectedStep.equipment || ""}
                          onChange={(e) => updateField('equipment', e.target.value)}
                          className="w-full px-3 py-2 rounded bg-[var(--color-page)] border border-[var(--color-border-theme)] text-xs"
                        >
                          <option value="">选择...</option>
                          {EQUIPMENT.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                      </div>
                    )}
                    {currentParams.includes("heat") && (
                      <div>
                        <label className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2 block">火力</label>
                        <select
                          value={selectedStep.heat_level || ""}
                          onChange={(e) => updateField('heat_level', e.target.value)}
                          className="w-full px-3 py-2 rounded bg-[var(--color-page)] border border-[var(--color-border-theme)] text-xs"
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
      
      {/* Mobile Backdrop */}
      {selectedIndex !== null && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
        />
      )}

    </div>
  )
}
