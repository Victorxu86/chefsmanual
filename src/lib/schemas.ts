import { z } from "zod"
import { 
  CUISINES, 
  DIFFICULTIES, 
  INGREDIENT_CATEGORIES, 
  STEP_TYPES, 
  ATTENTION_LEVELS,
  EQUIPMENT,
  HEAT_LEVELS,
  RECIPE_CATEGORIES 
} from "./constants"

// 提取常量的值作为 Enum
const CuisineEnum = z.enum(CUISINES.map(c => c.value) as [string, ...string[]]);
const DifficultyEnum = z.enum(DIFFICULTIES.map(d => d.value) as [string, ...string[]]);
const StepTypeEnum = z.enum(STEP_TYPES.map(t => t.value) as [string, ...string[]]);
const AttentionEnum = z.enum(ATTENTION_LEVELS.map(a => a.value) as [string, ...string[]]);
const IngredientCategoryEnum = z.enum(INGREDIENT_CATEGORIES.map(c => c.value) as [string, ...string[]]);
const RecipeCategoryEnum = z.enum(RECIPE_CATEGORIES.map(c => c.value) as [string, ...string[]]);

// 辅助函数：将空字符串转换为 undefined
const emptyToUndefined = (val: unknown) => (val === "" ? undefined : val);

// 辅助函数：安全地将值转换为数字，处理空值和NaN
const safeNumber = (val: unknown) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

// 食材 Schema
export const ingredientSchema = z.object({
  id: z.string().optional(), // 用于编辑模式
  name: z.string().min(1, "食材名称必填"),
  amount: z.string().optional(),
  unit: z.string().optional(),
  category: z.preprocess(emptyToUndefined, IngredientCategoryEnum.optional().default("other")),
  prep_note: z.string().optional(), // "切丝", "去皮"
  display_order: z.number().default(0),
})

// 步骤 Schema (核心中的核心)
export const stepSchema = z.object({
  id: z.string().optional(),
  step_order: z.number(),
  
  instruction: z.string().min(1, "步骤内容必填"),
  description: z.string().optional(),
  
  // 核心调度数据
  duration: z.preprocess(safeNumber, z.number().min(0, "时长不能为负").default(0)), // 秒
  step_type: z.preprocess(emptyToUndefined, StepTypeEnum.default("cook")),
  
  // 并行与资源
  is_active: z.boolean().default(true), // 占用人手?
  is_interruptible: z.boolean().default(true), // 能打断?
  attention_level: z.preprocess(emptyToUndefined, AttentionEnum.default("medium")),
  
  // 物理环境
  equipment: z.preprocess(emptyToUndefined, z.string().optional()), // 存 value, 如 "wok"
  temperature_c: z.preprocess(safeNumber, z.number().optional()), // 处理空字符串转数字
  heat_level: z.preprocess(emptyToUndefined, z.string().optional()), // 存 value, 如 "high"
  
  // 依赖关系 (V2)
  input_ingredients: z.array(z.string()).optional(), // 这一步用到了哪些食材ID
  
  // 前端临时字段 (V5 Editor State)
  _actionKey: z.string().optional(),
  _actionLabel: z.string().optional(),
  _selectedIngredients: z.array(z.string()).optional(),
})

// 菜谱 Schema
export const recipeSchema = z.object({
  title: z.string().min(1, "菜谱名称必填"),
  description: z.string().optional(),
  cover_image: z.string().optional(),
  
  cuisine: z.preprocess(emptyToUndefined, CuisineEnum.optional()),
  category: z.preprocess(emptyToUndefined, RecipeCategoryEnum.default("main")), // 新增：菜品类别
  difficulty: z.preprocess(emptyToUndefined, DifficultyEnum.default("medium")),
  servings: z.preprocess(safeNumber, z.number().min(1).default(2)),
  
  is_public: z.boolean().default(false),
  
  // 关联数据
  ingredients: z.array(ingredientSchema).default([]),
  steps: z.array(stepSchema).default([]),
})

export type RecipeFormValues = z.infer<typeof recipeSchema>
export type StepFormValues = z.infer<typeof stepSchema>
export type IngredientFormValues = z.infer<typeof ingredientSchema>
