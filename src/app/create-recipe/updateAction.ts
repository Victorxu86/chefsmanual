'use server'

import { createClient } from '@/utils/supabase/server'
import { recipeSchema } from '@/lib/schemas'

export async function updateRecipe(id: string, formData: any) {
  const supabase = await createClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Unauthorized" }
  }

  // 2. Validation
  const result = recipeSchema.safeParse(formData)
  if (!result.success) {
    return { error: "数据验证失败", details: result.error.flatten() }
  }
  
  const data = result.data

  // 3. Update Recipe Meta
  const activeTime = data.steps.reduce((acc, step) => step.is_active ? acc + step.duration : acc, 0)
  const passiveTime = data.steps.reduce((acc, step) => !step.is_active ? acc + step.duration : acc, 0)
  const totalTime = data.steps.reduce((acc, step) => acc + step.duration, 0)

  const { error: recipeError } = await supabase
    .from('recipes')
    .update({
      title: data.title,
      description: data.description,
      cuisine: data.cuisine,
      difficulty: data.difficulty,
      servings: data.servings,
      is_public: data.is_public,
      total_time_minutes: Math.ceil(totalTime / 60),
      active_time_minutes: Math.ceil(activeTime / 60),
      passive_time_minutes: Math.ceil(passiveTime / 60),
    })
    .eq('id', id)
    .eq('author_id', user.id) // Ensure ownership

  if (recipeError) {
    return { error: "更新菜谱失败: " + recipeError.message }
  }

  // 4. Update Ingredients (Full Replace Strategy)
  // Delete old
  await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
  
  // Insert new & Build Map
  const ingredientIdMap = new Map<string, string>()

  if (data.ingredients.length > 0) {
    const ingredientsToInsert = data.ingredients.map((ing, idx) => ({
      recipe_id: id,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: ing.category,
      display_order: idx,
    }))

    const { data: insertedIngredients, error: ingError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientsToInsert)
      .select('id, display_order')

    if (ingError) {
      console.error("Ingredient Error:", ingError)
    } else if (insertedIngredients) {
      insertedIngredients.forEach(ing => {
        ingredientIdMap.set(ing.display_order.toString(), ing.id)
      })
    }
  }

  // 5. Update Steps (Full Replace Strategy)
  // Delete old
  await supabase.from('recipe_steps').delete().eq('recipe_id', id)

  if (data.steps.length > 0) {
    const stepsToInsert = data.steps.map((step: any, idx) => {
      // Resolve Ingredient IDs (Frontend Index -> New UUID)
      const inputIngredients = (step._selectedIngredients || [])
        .map((indexStr: string) => ingredientIdMap.get(indexStr))
        .filter((id: string | undefined) => id !== undefined)

      return {
        recipe_id: id,
        step_order: idx + 1,
        instruction: step.instruction,
        description: step.description,
        duration_seconds: step.duration,
        step_type: step.step_type,
        is_active: step.is_active,
        is_interruptible: step.is_interruptible,
        attention_level: step.attention_level,
        equipment: step.equipment,
        heat_level: step.heat_level,
        input_ingredients: inputIngredients
      }
    })

    const { error: stepError } = await supabase
      .from('recipe_steps')
      .insert(stepsToInsert)

    if (stepError) {
      console.error("Step Error:", stepError)
      return { error: "更新步骤失败: " + stepError.message }
    }
  }

  // Success
  return { success: true, id: id }
}

