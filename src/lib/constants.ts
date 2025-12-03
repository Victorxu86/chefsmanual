// 预设字典库

export const CUISINES = [
  { value: "chinese", label: "中餐" },
  { value: "western", label: "西餐" },
  { value: "japanese", label: "日料" },
  { value: "french", label: "法餐" },
  { value: "italian", label: "意餐" },
  { value: "baking", label: "烘焙" },
  { value: "other", label: "其他" },
] as const

export const DIFFICULTIES = [
  { value: "easy", label: "简单 (Easy)" },
  { value: "medium", label: "中等 (Medium)" },
  { value: "hard", label: "困难 (Hard)" },
  { value: "chef", label: "专业 (Chef)" },
] as const

export const STEP_TYPES = [
  { value: "prep", label: "备菜 (Prep)" },
  { value: "cook", label: "烹饪 (Cook)" },
  { value: "wait", label: "等待 (Wait)" },
  { value: "serve", label: "摆盘 (Serve)" },
] as const

export const EQUIPMENT = [
  { value: "wok", label: "炒锅 (Wok)", station: "stove" },
  { value: "pan", label: "平底锅 (Pan)", station: "stove" },
  { value: "pot", label: "汤锅 (Pot)", station: "stove" },
  { value: "pressure_cooker", label: "压力锅", station: "stove" },
  { value: "oven", label: "烤箱 (Oven)", station: "oven" },
  { value: "steamer", label: "蒸箱 (Steamer)", station: "oven" },
  { value: "microwave", label: "微波炉", station: "counter" },
  { value: "air_fryer", label: "空气炸锅", station: "counter" },
  { value: "board", label: "砧板 (Board)", station: "counter" },
  { value: "bowl", label: "大碗 (Bowl)", station: "counter" },
  { value: "sous_vide", label: "低温慢煮机", station: "counter" },
  { value: "blender", label: "搅拌机", station: "counter" },
] as const

export const HEAT_LEVELS = [
  { value: "low", label: "小火 / 文火" },
  { value: "medium_low", label: "中小火" },
  { value: "medium", label: "中火" },
  { value: "medium_high", label: "中大火" },
  { value: "high", label: "大火 / 爆炒" },
  { value: "off", label: "关火 / 余温" },
] as const

export const ATTENTION_LEVELS = [
  { value: "low", label: "无需照看 (Low)", description: "可以离开厨房" },
  { value: "medium", label: "间歇照看 (Medium)", description: "偶尔翻动一下" },
  { value: "high", label: "全程专注 (High)", description: "手不能停，眼不能离" },
] as const

export const INGREDIENT_CATEGORIES = [
  { value: "vegetable", label: "蔬菜" },
  { value: "meat", label: "肉禽蛋" },
  { value: "seafood", label: "海鲜" },
  { value: "grain", label: "谷物/主食" },
  { value: "spice", label: "调料/香料" },
  { value: "dairy", label: "乳制品" },
  { value: "other", label: "其他" },
] as const

export const INGREDIENT_UNITS = [
  { value: "g", label: "克 (g)", type: "precise" },
  { value: "kg", label: "千克 (kg)", type: "precise" },
  { value: "ml", label: "毫升 (ml)", type: "precise" },
  { value: "l", label: "升 (L)", type: "precise" },
  { value: "tsp", label: "茶匙", type: "precise" },
  { value: "tbsp", label: "汤匙", type: "precise" },
  { value: "cup", label: "杯", type: "precise" },
  { value: "pcs", label: "个/只/根", type: "precise" },
  { value: "some", label: "适量", type: "vague" },
  { value: "little", label: "少许", type: "vague" },
  { value: "pinch", label: "一撮", type: "vague" },
  { value: "dash", label: "一点", type: "vague" },
  { value: "taste", label: "按口味", type: "vague" },
] as const

// 形状字典
export const SHAPES = [
  { value: "slice", label: "片 (Slices)" },
  { value: "strip", label: "丝 (Strips)" },
  { value: "cube", label: "丁/块 (Cubes)" },
  { value: "mince", label: "末/蓉 (Minced)" },
  { value: "chunk", label: "滚刀块 (Chunks)" },
  { value: "ring", label: "圈 (Rings)" },
  { value: "flower", label: "花刀 (Flower)" },
  { value: "segment", label: "段 (Segments)" },
  { value: "whole", label: "整只 (Whole)" },
] as const

// === NEW: 完整的动作层级体系 (V4) ===

export type ActionDefinition = {
  label: string
  icon: string
  type: "prep" | "cook" | "wait" | "serve"
  params: string[] // "ingredient", "ingredients", "heat", "tool", "duration", "shape", "condiment"
}

// 扁平化的动作映射表 (用于快速查找)
export const ACTIONS: Record<string, ActionDefinition> = {}

// 层级结构定义 (用于UI渲染)
export const ACTION_HIERARCHY = [
  {
    id: "heat_cook",
    label: "加热/烹调",
    icon: "🔥",
    categories: [
      {
        id: "stir_fry",
        label: "炒",
        actions: [
          { id: "stir_fry_basic", label: "炒", icon: "🍳", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
          { id: "stir_fry_quick", label: "爆炒", icon: "🔥", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
          { id: "stir_fry_dry", label: "干煸", icon: "🏜️", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
          { id: "stir_fry_soft", label: "滑炒", icon: "🌫️", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
        ]
      },
      {
        id: "pan_fry",
        label: "煎",
        actions: [
          { id: "pan_fry_basic", label: "煎", icon: "🥘", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
          { id: "pan_fry_slow", label: "慢煎", icon: "🐢", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
          { id: "pan_fry_sear", label: "煎封", icon: "🥩", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
        ]
      },
      {
        id: "deep_fry",
        label: "炸",
        actions: [
          { id: "deep_fry_basic", label: "油炸", icon: "🍤", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
          { id: "deep_fry_crisp", label: "酥炸", icon: "🍗", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
          { id: "deep_fry_double", label: "复炸", icon: "🔁", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
        ]
      },
      {
        id: "boil_stew",
        label: "煮/炖",
        actions: [
          { id: "boil", label: "煮", icon: "🍲", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
          { id: "blanch", label: "焯水", icon: "💧", type: "cook", params: ["ingredients", "duration", "tool"] },
          { id: "stew", label: "炖", icon: "🥘", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
          { id: "braise", label: "焖", icon: "🍲", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
          { id: "simmer", label: "煨", icon: "🍵", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
        ]
      },
      {
        id: "steam",
        label: "蒸",
        actions: [
          { id: "steam_basic", label: "蒸", icon: "♨️", type: "cook", params: ["ingredients", "duration", "tool"] },
          { id: "steam_high", label: "旺火蒸", icon: "🌋", type: "cook", params: ["ingredients", "duration", "tool"] },
        ]
      },
      {
        id: "oven",
        label: "烤/烘焙",
        actions: [
          { id: "bake", label: "烘烤", icon: "🍰", type: "cook", params: ["ingredients", "temp", "duration", "tool"] },
          { id: "roast", label: "烤肉/菜", icon: "🍖", type: "cook", params: ["ingredients", "temp", "duration", "tool"] },
          { id: "broil", label: "炙烤", icon: "🍢", type: "cook", params: ["ingredients", "temp", "duration", "tool"] },
        ]
      }
    ]
  },
  {
    id: "prep",
    label: "准备/切配",
    icon: "🔪",
    categories: [
      {
        id: "cut",
        label: "切工",
        actions: [
          { id: "cut_basic", label: "切", icon: "🔪", type: "prep", params: ["ingredient", "shape", "duration"] },
          { id: "mince", label: "剁碎/蓉", icon: "🔨", type: "prep", params: ["ingredient", "duration"] },
          { id: "slice", label: "切片", icon: "🥒", type: "prep", params: ["ingredient", "duration"] }, // Shortcut
          { id: "shred", label: "切丝", icon: "🥕", type: "prep", params: ["ingredient", "duration"] }, // Shortcut
        ]
      },
      {
        id: "clean",
        label: "清洗/处理",
        actions: [
          { id: "wash", label: "清洗", icon: "💧", type: "prep", params: ["ingredient", "duration"] },
          { id: "peel", label: "去皮", icon: "🥔", type: "prep", params: ["ingredient", "duration"] },
          { id: "debone", label: "剔骨/去刺", icon: "🦴", type: "prep", params: ["ingredient", "duration"] },
          { id: "shell", label: "剥壳/去虾线", icon: "🦐", type: "prep", params: ["ingredient", "duration"] },
        ]
      }
    ]
  },
  {
    id: "season_mix",
    label: "腌制/混合",
    icon: "🥣",
    categories: [
      {
        id: "marinate",
        label: "腌制",
        actions: [
          { id: "marinate", label: "腌制", icon: "🥣", type: "prep", params: ["ingredient", "condiment", "duration"] },
          { id: "coat", label: "挂糊/上浆", icon: "🥚", type: "prep", params: ["ingredient", "duration"] },
          { id: "bread", label: "裹粉/面包糠", icon: "🍞", type: "prep", params: ["ingredient", "duration"] },
        ]
      },
      {
        id: "mix",
        label: "混合",
        actions: [
          { id: "mix", label: "搅拌/混合", icon: "🔄", type: "prep", params: ["ingredients", "duration"] },
          { id: "whip", label: "打发", icon: "🌪️", type: "prep", params: ["ingredients", "duration"] },
          { id: "knead", label: "揉面", icon: "👐", type: "prep", params: ["ingredients", "duration"] },
        ]
      }
    ]
  },
  {
    id: "finish",
    label: "完成/其他",
    icon: "🏁",
    categories: [
      {
        id: "serve",
        label: "摆盘",
        actions: [
          { id: "plate", label: "装盘", icon: "🍽️", type: "serve", params: ["duration"] },
          { id: "garnish", label: "点缀", icon: "🌿", type: "serve", params: ["duration"] },
        ]
      },
      {
        id: "rest",
        label: "静置",
        actions: [
          { id: "rest", label: "静置/醒面", icon: "⏳", type: "wait", params: ["duration"] },
          { id: "cool", label: "冷却", icon: "❄️", type: "wait", params: ["duration"] },
          { id: "freeze", label: "冷冻", icon: "🧊", type: "wait", params: ["duration"] },
        ]
      }
    ]
  }
] as const

// Populate the flat ACTIONS map for easy lookup
// @ts-ignore
ACTION_HIERARCHY.forEach(realm => {
  // @ts-ignore
  realm.categories.forEach(category => {
    // @ts-ignore
    category.actions.forEach(action => {
      // @ts-ignore
      ACTIONS[action.id] = action
    })
  })
})

export type ActionKey = keyof typeof ACTIONS
