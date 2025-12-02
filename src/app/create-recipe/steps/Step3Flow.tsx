"use client"

import { useState } from "react"
import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { RecipeFormValues } from "@/lib/schemas"
import { ACTIONS, ActionKey, SHAPES, HEAT_LEVELS, EQUIPMENT } from "@/lib/constants"
import { Trash2, Check, X, GripVertical } from "lucide-react"

export function Step3Flow() {
  const { control } = useFormContext() // 获取 control
  const { append, remove, fields } = useFieldArray({
    control,
    name: "steps"
  })
  
  // 读取已填写的食材，供选择
  const ingredients = useWatch({ control, name: "ingredients" }) || []

  // 临时状态：正在构建的步骤
  const [editingAction, setEditingAction] = useState<ActionKey | null>(null)
  const [draftStep, setDraftStep] = useState<any>({})

  // 1. 选择动作
  const handleActionClick = (key: ActionKey) => {
    setEditingAction(key)
    setDraftStep({
      actionKey: key,
      selectedIngredients: [],
      duration: 0,
      // 默认值
      heat: 'medium',
      tool: 'wok'
    })
  }

  // 2. 提交动作 -> 生成 Step
  const confirmAction = () => {
    if (!editingAction) return

    const actionDef = ACTIONS[editingAction]
    
    // 生成自然语言指令
    let instruction = actionDef.label
    const ingredientNames = ingredients
      .filter((_, i) => draftStep.selectedIngredients.includes(i.toString()))
      .map(i => i.name)
      .join("、")
    
    if (ingredientNames) instruction += ` ${ingredientNames}`
    if (draftStep.shape) instruction += ` 切成${SHAPES.find(s => s.value === draftStep.shape)?.label}`
    
    append({
      step_order: 0, // 后端会自动修正
      instruction: instruction,
      step_type: actionDef.type,
      duration: Number(draftStep.duration) * 60, // 分钟转秒
      is_active: actionDef.type !== 'wait',
      equipment: draftStep.tool,
      heat_level: draftStep.heat,
      // 还可以存更多结构化数据
    })

    setEditingAction(null)
    setDraftStep({})
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      
      <h2 className="text-xl font-bold text-[var(--color-main)]">烹饪流程</h2>

      {/* ================= 1. 动作选择区 (Action Grid) ================= */}
      {!editingAction && (
        <div className="grid grid-cols-4 gap-4">
          {(Object.entries(ACTIONS) as [ActionKey, typeof ACTIONS[ActionKey]][]).map(([key, def]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleActionClick(key)}
              className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] hover:border-[var(--color-accent)] hover:shadow-md transition-all group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{def.icon}</span>
              <span className="text-sm font-bold text-[var(--color-main)]">{def.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ================= 2. 参数构建区 (Sentence Builder) ================= */}
      {editingAction && (
        <div className="p-6 rounded-[var(--radius-theme)] bg-[var(--color-card)] border-2 border-[var(--color-accent)] shadow-xl space-y-6">
          
          {/* 标题栏 */}
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border-theme)]">
            <span className="text-4xl">{ACTIONS[editingAction].icon}</span>
            <div>
              <h3 className="text-lg font-bold text-[var(--color-main)]">
                {ACTIONS[editingAction].label} ...
              </h3>
              <p className="text-xs text-[var(--color-muted)]">构建你的指令</p>
            </div>
          </div>

          {/* 动态表单：根据 params 渲染 */}
          <div className="space-y-6">
            
            {/* 选择食材 */}
            {(ACTIONS[editingAction].params.includes("ingredient") || ACTIONS[editingAction].params.includes("ingredients")) && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">对象 (选择食材)</label>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing, idx) => {
                    const isSelected = (draftStep.selectedIngredients || []).includes(idx.toString())
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const current = draftStep.selectedIngredients || []
                          const next = current.includes(idx.toString())
                            ? current.filter((i: string) => i !== idx.toString())
                            : [...current, idx.toString()]
                          setDraftStep({ ...draftStep, selectedIngredients: next })
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
                  })}
                  {ingredients.length === 0 && <span className="text-xs text-red-500">请先在上一步添加食材</span>}
                </div>
              </div>
            )}

            {/* 切割形状 */}
            {ACTIONS[editingAction].params.includes("shape") && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">切成什么样？</label>
                <div className="flex flex-wrap gap-2">
                  {SHAPES.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setDraftStep({ ...draftStep, shape: s.value })}
                      className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
                        draftStep.shape === s.value
                          ? 'bg-blue-100 text-blue-700 border-blue-300'
                          : 'bg-[var(--color-page)] text-[var(--color-muted)] border-[var(--color-border-theme)]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 火力 */}
            {ACTIONS[editingAction].params.includes("heat") && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">火力</label>
                <input 
                  type="range" min="0" max="4" step="1" 
                  className="w-full accent-[var(--color-accent)]"
                  value={HEAT_LEVELS.findIndex(h => h.value === draftStep.heat)}
                  onChange={e => setDraftStep({ ...draftStep, heat: HEAT_LEVELS[e.target.valueAsNumber].value })}
                />
                <div className="flex justify-between text-xs text-[var(--color-muted)] mt-1">
                  {HEAT_LEVELS.map(h => <span key={h.value}>{h.label.split(' ')[0]}</span>)}
                </div>
              </div>
            )}

            {/* 时长 */}
            {ACTIONS[editingAction].params.includes("duration") && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-muted)] mb-2">预计耗时 (分钟)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    value={draftStep.duration || ''}
                    onChange={e => setDraftStep({ ...draftStep, duration: e.target.value })}
                    className="w-24 px-3 py-2 rounded border border-[var(--color-border-theme)] bg-[var(--color-page)] text-center font-bold text-lg"
                  />
                  <div className="flex gap-2">
                    {[1, 3, 5, 10, 30].map(m => (
                      <button 
                        key={m} type="button"
                        onClick={() => setDraftStep({ ...draftStep, duration: m })}
                        className="px-3 py-1 rounded bg-[var(--color-page)] text-xs hover:bg-[var(--color-border-theme)]"
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* 底部按钮 */}
          <div className="flex gap-3 pt-4 border-t border-[var(--color-border-theme)]">
            <button
              type="button"
              onClick={() => setEditingAction(null)}
              className="flex-1 py-3 rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] text-[var(--color-muted)] hover:bg-[var(--color-page)] flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" /> 取消
            </button>
            <button
              type="button"
              onClick={confirmAction}
              className="flex-1 py-3 rounded-[var(--radius-theme)] bg-[var(--color-accent)] text-white font-bold hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" /> 确认添加步骤
            </button>
          </div>

        </div>
      )}

      {/* ================= 3. 结果列表 (Timeline List) ================= */}
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-4 p-4 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] group">
            <span className="w-6 h-6 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center text-xs font-bold">
              {index + 1}
            </span>
            
            <div className="flex-1">
              <p className="text-[var(--color-main)] font-medium">{field.instruction}</p>
              <div className="flex gap-3 text-xs text-[var(--color-muted)] mt-1">
                {field.duration > 0 && <span>⏱️ {Math.round(field.duration / 60)} 分钟</span>}
                {field.equipment && <span>🔧 {EQUIPMENT.find(e => e.value === field.equipment)?.label}</span>}
                {field.heat_level && <span>🔥 {HEAT_LEVELS.find(h => h.value === field.heat_level)?.label}</span>}
              </div>
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              className="p-2 text-[var(--color-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

    </div>
  )
}
