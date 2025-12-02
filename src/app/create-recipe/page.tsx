"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { recipeSchema, type RecipeFormValues } from "@/lib/schemas"
import { createRecipe } from "./actions"
import { DashboardHeader } from "@/components/DashboardHeader"
import { useMode } from "@/context/ModeContext"
import { Plus, Trash2, Save, Clock, Flame, GripVertical } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CreateRecipePage() {
  const { mode } = useMode()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const form = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: "",
      description: "",
      servings: 2,
      prepTime: 10,
      cookTime: 20,
      steps: [
        { id: "1", instruction: "准备好所有食材", duration: 0, isPassive: false }
      ]
    }
  })

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control: form.control,
    name: "steps"
  })

  async function onSubmit(data: RecipeFormValues) {
    setIsSubmitting(true)
    try {
      // 这里我们需要把数据传给 Server Action
      // 注意：Server Actions 通常接受 FormData，但为了复杂数据结构，我们也可以直接传 JSON 对象
      // 但为了保险起见，我们在 client 组件里调用 server action 函数
      const result = await createRecipe(data)
      if (result?.error) {
        alert(result.error)
      }
    } catch (error) {
      console.error(error)
      alert("发生未知错误")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail="" /> {/* 这里的 userEmail 暂时留空或通过 props 传入 */}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* 左侧：编辑区 */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[var(--color-main)] mb-2">
                {mode === "personal" ? "创建新菜谱" : "DEFINE_NEW_SOP"}
              </h1>
              <p className="text-[var(--color-muted)]">
                {mode === "personal" ? "记录您的独家美味秘方" : "Standardize kitchen operations protocol."}
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              {/* 基本信息卡片 */}
              <div className="p-6 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] space-y-6">
                <h2 className="text-xl font-bold text-[var(--color-main)] flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded-full bg-[var(--color-accent)]" />
                  基本信息
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-main)] mb-1">
                      菜谱名称
                    </label>
                    <input
                      {...form.register("title")}
                      className="w-full px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none transition-all"
                      placeholder="例如：经典红烧肉"
                    />
                    {form.formState.errors.title && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--color-main)] mb-1">
                      简介
                    </label>
                    <textarea
                      {...form.register("description")}
                      rows={3}
                      className="w-full px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none transition-all"
                      placeholder="描述一下这道菜的风味特点..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-main)] mb-1">
                        准备时间 (分钟)
                      </label>
                      <input
                        type="number"
                        {...form.register("prepTime", { valueAsNumber: true })}
                        className="w-full px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-main)] mb-1">
                        烹饪时间 (分钟)
                      </label>
                      <input
                        type="number"
                        {...form.register("cookTime", { valueAsNumber: true })}
                        className="w-full px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-[var(--color-main)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 步骤编辑器 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[var(--color-main)] flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full bg-[var(--color-accent)]" />
                    烹饪步骤
                  </h2>
                  <button
                    type="button"
                    onClick={() => appendStep({ id: Date.now().toString(), instruction: "", duration: 0, isPassive: false })}
                    className="text-sm font-medium text-[var(--color-accent)] hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> 添加步骤
                  </button>
                </div>

                <div className="space-y-3">
                  {stepFields.map((field, index) => (
                    <div 
                      key={field.id} 
                      className="group flex gap-3 items-start p-4 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] hover:border-[var(--color-accent)] transition-all"
                    >
                      <div className="mt-2 text-[var(--color-muted)] cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      
                      <div className="w-8 h-8 mt-1 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] flex items-center justify-center font-bold shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 space-y-3">
                        <textarea
                          {...form.register(`steps.${index}.instruction`)}
                          rows={2}
                          placeholder={`步骤 ${index + 1} 的具体操作...`}
                          className="w-full px-3 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-transparent focus:bg-white focus:border-[var(--color-accent)] outline-none transition-all text-sm"
                        />
                        
                        <div className="flex gap-4">
                           <div className="flex items-center gap-2">
                             <Clock className="h-4 w-4 text-[var(--color-muted)]" />
                             <input
                               type="number"
                               placeholder="秒"
                               {...form.register(`steps.${index}.duration`, { valueAsNumber: true })}
                               className="w-20 px-2 py-1 text-sm rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-transparent text-[var(--color-main)] focus:ring-1 focus:ring-[var(--color-accent)] outline-none"
                             />
                             <span className="text-xs text-[var(--color-muted)]">秒</span>
                           </div>
                           
                           <label className="flex items-center gap-2 cursor-pointer">
                             <input 
                               type="checkbox" 
                               {...form.register(`steps.${index}.isPassive`)}
                               className="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                             />
                             <span className="text-xs text-[var(--color-muted)]">无需照看 (被动等待)</span>
                           </label>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="mt-2 text-[var(--color-muted)] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 保存按钮 */}
              <div className="sticky bottom-8 z-20 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-4 rounded-full bg-[var(--color-accent)] text-white font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">保存中...</span>
                  ) : (
                    <>
                      <Save className="h-5 w-5" /> 保存菜谱
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* 右侧：实时预览 */}
          <div className="hidden lg:block w-96">
            <div className="sticky top-24 space-y-6">
              <div className="p-6 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] shadow-lg">
                <h3 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider mb-4">
                  预览效果
                </h3>
                
                {/* 预览卡片 */}
                <div className="space-y-4">
                  <div className="aspect-video rounded-[var(--radius-theme)] bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)]">
                     <Utensils className="h-12 w-12 opacity-20" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-[var(--color-main)] line-clamp-1">
                      {form.watch("title") || "未命名菜谱"}
                    </h4>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-muted)]">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 
                        {(form.watch("prepTime") || 0) + (form.watch("cookTime") || 0)} 分钟
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="h-3 w-3" />
                        {form.watch("difficulty") === 'easy' ? '简单' : form.watch("difficulty") === 'medium' ? '中等' : '困难'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    {(form.watch("steps") || []).slice(0, 3).map((step, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
                        <span className="w-5 h-5 rounded-full bg-[var(--color-border-theme)] flex items-center justify-center text-[var(--color-main)] text-xs">
                          {i + 1}
                        </span>
                        <span className="truncate flex-1">{step.instruction || "..."}</span>
                      </div>
                    ))}
                    {(form.watch("steps") || []).length > 3 && (
                      <div className="text-xs text-center text-[var(--color-muted)] pt-2">
                        ... 还有 {(form.watch("steps") || []).length - 3} 个步骤
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}

