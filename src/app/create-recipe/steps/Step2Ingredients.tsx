"use client"

import { useFieldArray, useFormContext, useWatch } from "react-hook-form"
import { RecipeFormValues } from "@/lib/schemas"
import { INGREDIENT_CATEGORIES, INGREDIENT_UNITS } from "@/lib/constants"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { useState } from "react"

export function Step2Ingredients() {
  const { control, register } = useFormContext<RecipeFormValues>()
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients"
  })

  // 监听所有 ingredients 的值，以便动态控制 UI
  // 注意：useWatch 返回的是整个数组，性能消耗对于小列表可以接受
  const ingredients = useWatch({
    control,
    name: "ingredients"
  })

  // 快速添加状态
  const [quickName, setQuickName] = useState("")

  const handleQuickAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quickName.trim()) {
      e.preventDefault()
      append({
        name: quickName,
        amount: "",
        unit: "g", // 默认精确单位
        category: "other",
        display_order: fields.length
      })
      setQuickName("")
    }
  }

  // 辅助函数：判断单位是否是模糊单位
  const isVagueUnit = (unitValue: string | undefined) => {
    const unit = INGREDIENT_UNITS.find(u => u.value === unitValue)
    return unit?.type === "vague"
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-6 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--color-main)]">食材清单</h2>
          <span className="text-xs text-[var(--color-muted)]">输入名称按回车快速添加</span>
        </div>

        {/* 快速输入框 */}
        <div>
          <div className="relative">
            <input
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              onKeyDown={handleQuickAdd}
              placeholder="例如：胡萝卜 (按回车添加)"
              className="w-full px-4 py-3 pl-10 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none transition-all"
            />
            <Plus className="absolute left-3 top-3.5 h-5 w-5 text-[var(--color-muted)]" />
          </div>
        </div>

        {/* 食材卡片列表 */}
        <div className="space-y-2">
          {fields.length === 0 && (
            <div className="text-center py-8 text-[var(--color-muted)] bg-[var(--color-page)] rounded-[var(--radius-theme)] border border-dashed border-[var(--color-border-theme)]">
              暂无食材，请在上方添加
            </div>
          )}
          
          {fields.map((field, index) => {
            const currentUnit = ingredients?.[index]?.unit
            const isVague = isVagueUnit(currentUnit)

            return (
              <div key={field.id} className="flex items-center gap-2 p-3 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] group hover:border-[var(--color-accent)] transition-all">
                <GripVertical className="h-4 w-4 text-[var(--color-muted)] cursor-grab" />
                
                {/* 名称 */}
                <input
                  {...register(`ingredients.${index}.name`)}
                  className="flex-1 bg-transparent font-medium outline-none text-[var(--color-main)]"
                  placeholder="名称"
                />
                
                {/* 数量 (模糊单位时隐藏或禁用) */}
                <input
                  {...register(`ingredients.${index}.amount`)}
                  className={`w-16 bg-transparent text-right outline-none text-[var(--color-main)] placeholder-[var(--color-muted)] transition-all ${isVague ? 'opacity-30 cursor-not-allowed' : ''}`}
                  placeholder={isVague ? "-" : "数量"}
                  disabled={isVague}
                />
                
                {/* 单位选择器 */}
                <select
                  {...register(`ingredients.${index}.unit`)}
                  className="w-20 bg-transparent outline-none text-[var(--color-muted)] text-sm border-b border-transparent hover:border-[var(--color-accent)] cursor-pointer"
                >
                  <option value="">单位</option>
                  <optgroup label="精确">
                    {INGREDIENT_UNITS.filter(u => u.type === 'precise').map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="模糊">
                    {INGREDIENT_UNITS.filter(u => u.type === 'vague').map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </optgroup>
                </select>
                
                {/* 分类 */}
                <select
                  {...register(`ingredients.${index}.category`)}
                  className="w-24 bg-transparent text-xs text-[var(--color-muted)] outline-none border-l border-[var(--color-border-theme)] pl-2"
                >
                  {INGREDIENT_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 text-[var(--color-muted)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
