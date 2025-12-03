"use client"

import { useFormContext, useController } from "react-hook-form"
import { RecipeFormValues } from "@/lib/schemas"
import { CUISINES, DIFFICULTIES } from "@/lib/constants"
import { ImageUpload } from "@/components/ui/ImageUpload"

export function Step1Meta() {
  const { register, control, formState: { errors } } = useFormContext<RecipeFormValues>()
  
  // 使用 useController 来管理 cover_image，因为它不是标准的 input
  const { field: coverImageField } = useController({
    name: "cover_image",
    control,
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-6 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] space-y-6">
        <h2 className="text-xl font-bold text-[var(--color-main)] mb-4">基础信息</h2>
        
        {/* 封面图上传 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-main)] mb-2">
            菜谱封面
          </label>
          <ImageUpload 
            value={coverImageField.value} 
            onChange={coverImageField.onChange}
          />
        </div>

        {/* 标题 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-main)] mb-1">
            菜谱名称 <span className="text-red-500">*</span>
          </label>
          <input
            {...register("title")}
            className="w-full px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none transition-all"
            placeholder="例如：法式红酒炖牛肉"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        {/* 简介 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-main)] mb-1">简介</label>
          <textarea
            {...register("description")}
            rows={4}
            className="w-full px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none transition-all"
            placeholder="介绍一下这道菜的故事或风味..."
          />
        </div>

        {/* 选项网格 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 菜系 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-main)] mb-1">菜系</label>
            <select
              {...register("cuisine")}
              className="w-full px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none transition-all"
            >
              <option value="">选择菜系...</option>
              {CUISINES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* 难度 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-main)] mb-1">难度</label>
            <select
              {...register("difficulty")}
              className="w-full px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none transition-all"
            >
              {DIFFICULTIES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* 份量 */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-main)] mb-1">份量 (人)</label>
            <input
              type="number"
              {...register("servings", { valueAsNumber: true })}
              className="w-full px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] focus:ring-2 focus:ring-[var(--color-accent)] outline-none transition-all"
            />
          </div>
        </div>

        {/* 公开设置 */}
        <div className="flex items-center gap-3 pt-4 border-t border-[var(--color-border-theme)]">
          <input
            type="checkbox"
            id="isPublic"
            {...register("is_public")}
            className="w-5 h-5 rounded text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
          />
          <label htmlFor="isPublic" className="text-sm text-[var(--color-muted)] select-none">
            公开发布到菜谱商店（其他用户可以购买或查看）
          </label>
        </div>
      </div>
    </div>
  )
}
