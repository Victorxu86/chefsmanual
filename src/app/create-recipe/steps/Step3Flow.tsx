"use client"

import { useState } from "react"
import { useFieldArray, useFormContext } from "react-hook-form"
import { RecipeFormValues } from "@/lib/schemas"
import { STEP_TYPES, EQUIPMENT, HEAT_LEVELS, ATTENTION_LEVELS } from "@/lib/constants"
import { Plus, Trash2, GripVertical, Clock, ChevronDown, ChevronUp, Zap } from "lucide-react"

export function Step3Flow() {
  const { control, register, watch } = useFormContext<RecipeFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps"
  })
  
  // 模式状态：基础/专业
  const [isProMode, setIsProMode] = useState(false)

  // 展开状态 map
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({})

  const toggleExpand = (index: number) => {
    setExpandedSteps(prev => ({ ...prev, [index]: !prev[index] }))
  }

  const handleAddStep = (type: "prep" | "cook" | "wait" | "serve") => {
    append({
      step_order: fields.length + 1,
      instruction: "",
      step_type: type,
      duration: 0,
      is_active: type !== "wait",
      is_interruptible: true,
      attention_level: "medium"
    })
    // 自动展开新步骤
    setExpandedSteps(prev => ({ ...prev, [fields.length]: true }))
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[var(--color-main)]">烹饪流程</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-muted)]">专业模式</span>
          <button 
            type="button"
            onClick={() => setIsProMode(!isProMode)}
            className={`w-10 h-6 rounded-full transition-colors relative ${isProMode ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-theme)]'}`}
          >
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isProMode ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="space-y-4">
        {fields.map((field, index) => {
          const type = watch(`steps.${index}.step_type`)
          const isExpanded = expandedSteps[index]

          return (
            <div key={field.id} className="rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] overflow-hidden transition-all hover:border-[var(--color-accent)]">
              {/* 头部摘要 */}
              <div 
                className="flex items-center gap-3 p-4 cursor-pointer bg-[var(--color-page)]/50"
                onClick={() => toggleExpand(index)}
              >
                <GripVertical className="h-4 w-4 text-[var(--color-muted)] cursor-grab" />
                
                <div className={`
                  px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider
                  ${type === 'prep' ? 'bg-blue-100 text-blue-700' : 
                    type === 'cook' ? 'bg-orange-100 text-orange-700' : 
                    type === 'wait' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}
                `}>
                  {STEP_TYPES.find(t => t.value === type)?.label}
                </div>

                <input
                  {...register(`steps.${index}.instruction`)}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-transparent font-medium outline-none text-[var(--color-main)] placeholder-[var(--color-muted)]"
                  placeholder="简要描述 (如: 切洋葱)"
                />

                <div className="flex items-center gap-4 text-sm text-[var(--color-muted)]">
                   <div className="flex items-center gap-1">
                     <Clock className="h-3 w-3" />
                     <span>{watch(`steps.${index}.duration`)}s</span>
                   </div>
                   {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </div>

              {/* 展开详情区 */}
              {isExpanded && (
                <div className="p-4 border-t border-[var(--color-border-theme)] bg-[var(--color-card)] space-y-4 animate-in slide-in-from-top-2 duration-200">
                  
                  {/* 时长与基本设置 */}
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">时长 (秒)</label>
                       <input 
                         type="number"
                         {...register(`steps.${index}.duration`, { valueAsNumber: true })}
                         className="w-full px-3 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-sm"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">设备</label>
                       <select 
                         {...register(`steps.${index}.equipment`)}
                         className="w-full px-3 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-sm"
                       >
                         <option value="">无/不限</option>
                         {EQUIPMENT.map(e => (
                           <option key={e.value} value={e.value}>{e.label}</option>
                         ))}
                       </select>
                     </div>
                  </div>

                  <div className="pt-2">
                    <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">详细说明</label>
                    <textarea 
                      {...register(`steps.${index}.description`)}
                      rows={2}
                      className="w-full px-3 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-sm"
                      placeholder="补充细节，如切的大小、注意事项..."
                    />
                  </div>

                  {/* 专业模式字段 */}
                  {isProMode && (
                    <div className="pt-4 mt-4 border-t border-[var(--color-border-theme)] border-dashed grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">火力/温度</label>
                         <select 
                           {...register(`steps.${index}.heat_level`)}
                           className="w-full px-3 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-sm"
                         >
                           <option value="">无</option>
                           {HEAT_LEVELS.map(h => (
                             <option key={h.value} value={h.value}>{h.label}</option>
                           ))}
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">注意力等级</label>
                         <select 
                           {...register(`steps.${index}.attention_level`)}
                           className="w-full px-3 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-sm"
                         >
                           {ATTENTION_LEVELS.map(a => (
                             <option key={a.value} value={a.value}>{a.label}</option>
                           ))}
                         </select>
                      </div>
                      
                      <div className="col-span-2 flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" {...register(`steps.${index}.is_active`)} className="rounded text-[var(--color-accent)]" />
                          占用人手 (Active)
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" {...register(`steps.${index}.is_interruptible`)} className="rounded text-[var(--color-accent)]" />
                          可随时打断 (Interruptible)
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 删除按钮 */}
                  <div className="flex justify-end pt-2">
                    <button 
                      type="button"
                      onClick={() => remove(index)}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> 删除步骤
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 添加按钮栏 (Action Bar) */}
      <div className="grid grid-cols-4 gap-3 pt-4">
        <button 
          type="button"
          onClick={() => handleAddStep('prep')}
          className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-theme)] bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors border border-blue-200"
        >
          <span className="text-xl mb-1">🔪</span>
          <span className="text-xs font-bold">备菜 (Prep)</span>
        </button>
        <button 
          type="button"
          onClick={() => handleAddStep('cook')}
          className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-theme)] bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors border border-orange-200"
        >
          <span className="text-xl mb-1">🍳</span>
          <span className="text-xs font-bold">烹饪 (Cook)</span>
        </button>
        <button 
          type="button"
          onClick={() => handleAddStep('wait')}
          className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-theme)] bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors border border-purple-200"
        >
          <span className="text-xl mb-1">⏳</span>
          <span className="text-xs font-bold">等待 (Wait)</span>
        </button>
        <button 
          type="button"
          onClick={() => handleAddStep('serve')}
          className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-theme)] bg-green-50 hover:bg-green-100 text-green-700 transition-colors border border-green-200"
        >
          <span className="text-xl mb-1">🍽️</span>
          <span className="text-xs font-bold">收尾 (Serve)</span>
        </button>
      </div>

    </div>
  )
}

