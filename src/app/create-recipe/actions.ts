'use server'

import { createClient } from '@/utils/supabase/server'
import { recipeSchema } from '@/lib/schemas'
import { redirect } from 'next/navigation'

export async function createRecipe(formData: any) {
  const supabase = await createClient()

  // 1. 获取当前用户
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Unauthorized")
  }

  // 2. 验证数据
  const result = recipeSchema.safeParse(formData)
  if (!result.success) {
    return { error: "数据验证失败", details: result.error.flatten() }
  }
  
  const data = result.data

  // 3. 插入主表 (recipes)
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      title: data.title,
      description: data.description,
      author_id: user.id,
      prep_time_minutes: data.prepTime,
      cook_time_minutes: data.cookTime,
      is_public: data.isPublic,
    })
    .select()
    .single()

  if (recipeError) {
    return { error: "创建菜谱失败: " + recipeError.message }
  }

  // 4. 插入步骤表 (steps)
  if (data.steps.length > 0) {
    const stepsToInsert = data.steps.map((step, index) => ({
      recipe_id: recipe.id,
      step_order: index + 1,
      instruction: step.instruction,
      duration_seconds: step.duration,
      is_parallel: step.isPassive // 对应我们 schema 里的 isPassive
    }))

    const { error: stepsError } = await supabase
      .from('steps')
      .insert(stepsToInsert)

    if (stepsError) {
      return { error: "保存步骤失败: " + stepsError.message }
    }
  }

  // 5. 跳转
  redirect('/dashboard')
}

