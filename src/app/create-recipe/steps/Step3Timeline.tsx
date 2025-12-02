"use client"

import { useState, useEffect } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { ACTIONS, ActionKey, EQUIPMENT, HEAT_LEVELS, SHAPES } from "@/lib/constants"
import { Plus, Trash2, Clock, Flame, ChevronRight, X, AlertCircle, Settings2 } from "lucide-react"

export function Step3Timeline() {
  const { control } = useFormContext()
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "steps"
  })
  
  const ingredients = useWatch({ control, name: "ingredients" }) || []
  
  // 当前选中的步骤索引 (用于右侧面板编辑)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  
  // 自动选中新添加的步骤
  const handleAddStep = () => {
    append({
      step_order: fields.length + 1,
      instruction: "新步骤",
      step_type: "cook",
      duration: 300, // 默认5分钟
      is_active: true,
      equipment: "wok",
      heat_level: "medium"
    })
    setSelectedIndex(fields.length)
  }

  // 监听 selectedIndex 变化，更新 draftStep
  const selectedStep = typeof selectedIndex === 'number' ? fields[selectedIndex] : null
  
  // 实时更新辅助函数
  const updateField = (field: string, value: any) => {
    if (selectedIndex === null) return
    // @ts-ignore
    update(selectedIndex, { ...selectedStep, [field]: value })
  }

  return (
    <div className="flex h-[600px] gap-6 animate-in fade-in duration-500">
      
      {/* ================== 左侧：时间轴流 ================== */}
      <div className="flex-1 flex flex-col bg-[var(--color-card)] rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--color-border-theme)] flex justify-between items-center bg-[var(--color-page)]/50">
          <h3 className="font-bold text-[var(--color-main)] flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent)]" />
            烹饪流程
          </h3>
          <span className="text-xs text-[var(--color-muted)]">
            {fields.length} 个步骤 · 总耗时 {Math.round(fields.reduce((acc, s: any) => acc + (s.duration || 0), 0) / 60)} 分钟
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {fields.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted)]">
              <Settings2 className="h-12 w-12 mb-4 opacity-20" />
              <p>点击下方按钮开始构建流程</p>
            </div>
          )}

          {fields.map((field: any, index) => (
            <div key={field.id} className="relative pl-8 group">
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
                    {field.instruction || "未命名步骤"}
                  </span>
                  <div className="flex items-center gap-2">
                    {field.duration > 0 && (
                      <span className="text-xs font-mono bg-[var(--color-card)] px-1.5 py-0.5 rounded border border-[var(--color-border-theme)]">
                        {Math.round(field.duration / 60)}m
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
                
                {/* 标签行 */}
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
          
          {/* 添加按钮 */}
          <button
            type="button"
            onClick={handleAddStep}
            className="ml-8 w-[calc(100%-2rem)] py-3 rounded-lg border-2 border-dashed border-[var(--color-border-theme)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent-light)]/10 transition-all flex items-center justify-center gap-2 group"
          >
            <div className="w-6 h-6 rounded-full bg-[var(--color-border-theme)] text-white flex items-center justify-center group-hover:bg-[var(--color-accent)] transition-colors">
              <Plus className="h-4 w-4" />
            </div>
            <span className="font-medium">添加下一个步骤</span>
          </button>
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
              
              {/* 1. 核心动作 */}
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3 block">核心动作</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(ACTIONS).map(([key, def]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        updateField('instruction', def.label) // 预填标题
                        // @ts-ignore
                        updateField('step_type', def.type)
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded border transition-all
                        ${selectedStep.instruction.includes(def.label) // 简单的选中判断
                          ? 'bg-[var(--color-accent-light)] border-[var(--color-accent)] text-[var(--color-accent)]' 
                          : 'bg-[var(--color-page)] border-[var(--color-border-theme)] hover:border-[var(--color-accent)]'}
                      `}
                    >
                      <span className="text-xl">{def.icon}</span>
                      <span className="text-[10px] mt-1">{def.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. 指令与对象 */}
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3 block">指令内容</label>
                <input
                  value={selectedStep.instruction}
                  onChange={(e) => updateField('instruction', e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[var(--color-page)] border border-[var(--color-border-theme)] text-[var(--color-main)] text-sm font-medium focus:ring-2 focus:ring-[var(--color-accent)] outline-none"
                  placeholder="例如：切洋葱"
                />
                
                {/* 快捷插入食材 */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {ingredients.map((ing: any) => (
                    <button
                      key={ing.name}
                      type="button"
                      onClick={() => updateField('instruction', selectedStep.instruction + " " + ing.name)}
                      className="px-2 py-1 rounded-full bg-[var(--color-page)] border border-[var(--color-border-theme)] text-xs text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                    >
                      + {ing.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. 时长 */}
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3 block">预计耗时</label>
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <input
                      type="range" min="0" max="60" step="1"
                      value={selectedStep.duration / 60}
                      onChange={(e) => updateField('duration', e.target.valueAsNumber * 60)}
                      className="w-full accent-[var(--color-accent)]"
                    />
                  </div>
                  <div className="w-16 text-right font-mono font-bold text-[var(--color-accent)]">
                    {Math.round(selectedStep.duration / 60)}m
                  </div>
                </div>
              </div>

              {/* 4. 环境配置 (设备/火力) */}
              <div>
                <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3 block">环境配置</label>
                <div className="space-y-3">
                  <select
                    value={selectedStep.equipment || ""}
                    onChange={(e) => updateField('equipment', e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[var(--color-page)] border border-[var(--color-border-theme)] text-sm"
                  >
                    <option value="">选择设备...</option>
                    {EQUIPMENT.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                  
                  <select
                    value={selectedStep.heat_level || ""}
                    onChange={(e) => updateField('heat_level', e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[var(--color-page)] border border-[var(--color-border-theme)] text-sm"
                  >
                    <option value="">选择火力...</option>
                    {HEAT_LEVELS.map(h => <option key={h.value} value={h.value}>{h.label}</option>)}
                  </select>
                </div>
              </div>

            </div>
          </>
        )}
      </div>

    </div>
  )
}

