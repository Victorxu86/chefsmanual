import { z } from "zod"

export const recipeSchema = z.object({
  title: z.string().min(1, "请输入菜谱名称"),
  description: z.string().optional(),
  servings: z.number().min(1, "至少 1 人份").default(2),
  prepTime: z.number().min(0, "准备时间不能为负").default(0),
  cookTime: z.number().min(0, "烹饪时间不能为负").default(0),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  isPublic: z.boolean().default(false),
  ingredients: z.array(
    z.object({
      name: z.string().min(1, "食材名称不能为空"),
      amount: z.string(),
      unit: z.string().optional(),
    })
  ).default([]),
  steps: z.array(
    z.object({
      id: z.string(),
      instruction: z.string().min(1, "步骤内容不能为空"),
      duration: z.number().default(0), // 秒
      isPassive: z.boolean().default(false), // 是否是被动等待
    })
  ).default([]),
})

export type RecipeFormValues = z.infer<typeof recipeSchema>

