'use server'

import { createClient } from '@/utils/supabase/server'
import { recipeSchema } from '@/lib/schemas'

export async function createRecipe(formData: any) {
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

  // 3. Insert Recipe
  const activeTime = data.steps.reduce((acc, step) => step.is_active ? acc + step.duration : acc, 0)
  const passiveTime = data.steps.reduce((acc, step) => !step.is_active ? acc + step.duration : acc, 0)
  const totalTime = data.steps.reduce((acc, step) => acc + step.duration, 0)

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      title: data.title,
      description: data.description,
      cover_image: data.cover_image,
      author_id: user.id,
      cuisine: data.cuisine,
      category: data.category,
      difficulty: data.difficulty,
      servings: data.servings,
      is_public: data.is_public,
      total_time_minutes: Math.ceil(totalTime / 60),
      active_time_minutes: Math.ceil(activeTime / 60),
      passive_time_minutes: Math.ceil(passiveTime / 60),
    })
    .select()
    .single()

  if (recipeError) {
    return { error: "创建菜谱失败: " + recipeError.message }
  }

  // 4. Insert Ingredients & Build Map
  // Map: Frontend Index (0, 1, 2) -> Database UUID
  const ingredientIdMap = new Map<string, string>()

  if (data.ingredients.length > 0) {
    const ingredientsToInsert = data.ingredients.map((ing, idx) => ({
      recipe_id: recipe.id,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: ing.category,
      display_order: idx,
    }))

    const { data: insertedIngredients, error: ingError } = await supabase
      .from('recipe_ingredients')
      .insert(ingredientsToInsert)
      .select('id, display_order') // Return ID and Order to build map

    if (ingError) {
      console.error("Ingredient Error:", ingError)
    } else if (insertedIngredients) {
      // Build the map based on display_order (which matches frontend index)
      insertedIngredients.forEach(ing => {
        ingredientIdMap.set(ing.display_order.toString(), ing.id)
      })
    }
  }

  // 5. Insert Steps with Mapped IDs
  if (data.steps.length > 0) {
    const stepsToInsert = data.steps.map((step: any, idx) => {
      // Resolve Ingredient IDs
      // Frontend sends _selectedIngredients as array of strings ["0", "1"]
      // We need to convert them to UUIDs using our map
      const inputIngredients = (step._selectedIngredients || [])
        .map((indexStr: string) => ingredientIdMap.get(indexStr))
        .filter((id: string | undefined) => id !== undefined)

      return {
        recipe_id: recipe.id,
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
        input_ingredients: inputIngredients // Store actual UUIDs
      }
    })

    const { error: stepError } = await supabase
      .from('recipe_steps')
      .insert(stepsToInsert)

    if (stepError) {
      console.error("Step Error:", stepError)
      return { error: "保存步骤失败: " + stepError.message }
    }
  }

  // Success
  return { success: true, id: recipe.id }
}
