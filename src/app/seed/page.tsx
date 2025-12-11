import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// === Seed Data Definition ===
const RECIPES = [
  {
    title: "蒸米饭",
    description: "粒粒分明，软糯香甜的基础主食。",
    cuisine: "chinese",
    category: "staple", // 新增分类
    difficulty: "easy",
    servings: 4,
    ingredients: [
      { name: "大米", amount: "2", unit: "cup", category: "grain" },
      { name: "清水", amount: "2.5", unit: "cup", category: "other" }
    ],
    steps: [
      { instruction: "取米", duration: 60, step_type: "prep", is_active: true },
      { instruction: "淘米", duration: 120, step_type: "prep", is_active: true },
      { instruction: "加水入锅", duration: 60, step_type: "prep", is_active: true },
      { instruction: "电饭煲煮饭", duration: 1800, step_type: "cook", is_active: false, equipment: "oven" }, // 借用oven代表电饭煲
      { instruction: "盛出摆盘", duration: 60, step_type: "serve", is_active: true }
    ]
  },
  {
    title: "宫保鸡丁",
    description: "经典川菜，糊辣荔枝味，鸡肉鲜嫩，花生酥脆。",
    cuisine: "chinese",
    category: "main", // 新增分类
    difficulty: "medium",
    servings: 2,
    ingredients: [
      { name: "鸡胸肉", amount: "300", unit: "g", category: "meat" },
      { name: "花生米", amount: "50", unit: "g", category: "grain" },
      { name: "干辣椒", amount: "10", unit: "g", category: "spice" },
      { name: "大葱", amount: "1", unit: "根", category: "vegetable" },
      { name: "姜", amount: "10", unit: "g", category: "spice" },
      { name: "蒜", amount: "3", unit: "瓣", category: "spice" },
      { name: "花椒", amount: "5", unit: "g", category: "spice" },
      { name: "宫保汁", amount: "1", unit: "碗", category: "spice" }
    ],
    steps: [
      { instruction: "鸡肉切丁", duration: 300, step_type: "prep", is_active: true },
      { instruction: "腌制鸡肉", duration: 120, step_type: "prep", is_active: true },
      { instruction: "静置腌制", duration: 600, step_type: "wait", is_active: false },
      { instruction: "切葱段姜片", duration: 180, step_type: "prep", is_active: true },
      { instruction: "调宫保汁", duration: 120, step_type: "prep", is_active: true },
      { instruction: "炸花生米", duration: 300, step_type: "cook", is_active: true, equipment: "wok", heat_level: "medium" },
      { instruction: "滑炒鸡丁", duration: 180, step_type: "cook", is_active: true, equipment: "wok", heat_level: "high" },
      { instruction: "爆香辣椒花椒", duration: 60, step_type: "cook", is_active: true, equipment: "wok", heat_level: "low" },
      { instruction: "下鸡肉葱段翻炒", duration: 120, step_type: "cook", is_active: true, equipment: "wok", heat_level: "high" },
      { instruction: "倒入料汁收浓", duration: 60, step_type: "cook", is_active: true, equipment: "wok", heat_level: "high" }
    ]
  },
  {
    title: "玉米排骨汤",
    description: "清甜滋润，营养丰富，适合全家享用的靓汤。",
    cuisine: "chinese",
    category: "soup", // 新增分类
    difficulty: "easy",
    servings: 4,
    ingredients: [
      { name: "排骨", amount: "500", unit: "g", category: "meat" },
      { name: "甜玉米", amount: "2", unit: "根", category: "vegetable" },
      { name: "胡萝卜", amount: "1", unit: "根", category: "vegetable" },
      { name: "红枣", amount: "5", unit: "颗", category: "other" },
      { name: "姜", amount: "3", unit: "片", category: "spice" },
      { name: "盐", amount: "适量", unit: "some", category: "spice" }
    ],
    steps: [
      { instruction: "排骨洗净", duration: 180, step_type: "prep", is_active: true },
      { instruction: "冷水焯水", duration: 300, step_type: "cook", is_active: true, equipment: "pot", heat_level: "high" },
      { instruction: "切玉米段", duration: 120, step_type: "prep", is_active: true },
      { instruction: "切胡萝卜块", duration: 120, step_type: "prep", is_active: true },
      { instruction: "加水加排骨姜片", duration: 120, step_type: "cook", is_active: true, equipment: "pot" },
      { instruction: "大火烧开", duration: 300, step_type: "cook", is_active: true, equipment: "pot", heat_level: "high" },
      { instruction: "转小火炖", duration: 2400, step_type: "cook", is_active: false, equipment: "pot", heat_level: "low" },
      { instruction: "加入玉米胡萝卜", duration: 60, step_type: "cook", is_active: true, equipment: "pot" },
      { instruction: "继续炖煮", duration: 1200, step_type: "cook", is_active: false, equipment: "pot", heat_level: "low" },
      { instruction: "加盐出锅", duration: 60, step_type: "serve", is_active: true }
    ]
  },
  {
    title: "杨枝甘露",
    description: "港式经典甜品，芒果椰香浓郁，西米Q弹爽滑。",
    cuisine: "chinese",
    category: "dessert", // 新增分类
    difficulty: "medium",
    servings: 4,
    ingredients: [
      { name: "芒果", amount: "3", unit: "个", category: "fruit" },
      { name: "西柚", amount: "0.5", unit: "个", category: "fruit" },
      { name: "西米", amount: "50", unit: "g", category: "grain" },
      { name: "椰浆", amount: "200", unit: "ml", category: "dairy" },
      { name: "糖", amount: "30", unit: "g", category: "spice" },
      { name: "水", amount: "500", unit: "ml", category: "other" }
    ],
    steps: [
      { instruction: "煮西米", duration: 900, step_type: "cook", is_active: true, equipment: "pot", heat_level: "medium" },
      { instruction: "西米过凉水", duration: 180, step_type: "prep", is_active: true },
      { instruction: "剥柚子粒", duration: 600, step_type: "prep", is_active: true },
      { instruction: "切芒果", duration: 300, step_type: "prep", is_active: true },
      { instruction: "芒果打泥", duration: 120, step_type: "prep", is_active: true, equipment: "blender" },
      { instruction: "混合芒果泥和椰浆", duration: 120, step_type: "prep", is_active: true, equipment: "bowl" },
      { instruction: "加入西米和柚子", duration: 60, step_type: "prep", is_active: true, equipment: "bowl" },
      { instruction: "冷藏静置", duration: 1800, step_type: "wait", is_active: false, equipment: "bowl" } // 改为 bowl 或 fridge (如果加了的话)
    ]
  }
]

// ... rest of the file (seedAction) ...
async function seedAction() {
  'use server'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  for (const recipeData of RECIPES) {
    // 1. Insert Recipe
    const activeTime = recipeData.steps.reduce((acc, s) => s.is_active ? acc + s.duration : acc, 0)
    const passiveTime = recipeData.steps.reduce((acc, s) => !s.is_active ? acc + s.duration : acc, 0)
    const totalTime = activeTime + passiveTime

    const { data: recipe, error: rError } = await supabase.from('recipes').insert({
      title: recipeData.title,
      description: recipeData.description,
      cuisine: recipeData.cuisine,
      category: recipeData.category, // 插入分类
      difficulty: recipeData.difficulty,
      servings: recipeData.servings,
      author_id: user.id,
      total_time_minutes: Math.ceil(totalTime / 60),
      active_time_minutes: Math.ceil(activeTime / 60),
      passive_time_minutes: Math.ceil(passiveTime / 60),
      is_public: true
    }).select().single()

    if (rError) {
      console.error("Recipe Error:", rError)
      continue
    }

    // 2. Insert Ingredients
    const ingredients = recipeData.ingredients.map((ing, idx) => ({
      recipe_id: recipe.id,
      ...ing,
      display_order: idx
    }))
    
    const { error: iError } = await supabase.from('recipe_ingredients').insert(ingredients)
    if (iError) console.error("Ingredient Error for " + recipeData.title, iError)

    // 3. Insert Steps
    const steps = recipeData.steps.map((step, idx) => {
      // Clean up object to match schema
      // 移除不属于 schema 的字段 (duration is mapped to duration_seconds)
      const { duration, ...rest } = step
      
      return {
        recipe_id: recipe.id,
        step_order: idx + 1,
        duration_seconds: duration,
        ...rest
      }
    })
    
    const { error: sError } = await supabase.from('recipe_steps').insert(steps)
    if (sError) {
      console.error("Step Error for " + recipeData.title, sError)
      // 如果步骤插入失败，我们应该把刚才创建的空壳菜谱删掉，避免污染
      await supabase.from('recipes').delete().eq('id', recipe.id)
      throw new Error(`Steps insertion failed: ${sError.message}`)
    }
  }

  revalidatePath('/recipes')
  redirect('/recipes')
}

export default function SeedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <h1 className="text-2xl font-bold">测试数据填充</h1>
      <form action={seedAction}>
        <button 
          type="submit"
          className="px-8 py-4 bg-black text-white rounded-full font-bold text-xl hover:scale-105 transition-transform"
        >
          🚀 生成 4 道预制菜谱 (V2)
        </button>
      </form>
      <p className="text-sm text-gray-500">此操作会插入新菜谱，不会删除旧菜谱</p>
    </div>
  )
}
