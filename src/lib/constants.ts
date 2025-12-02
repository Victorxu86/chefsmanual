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

// 新增：详细动作字典
export const ACTIONS = {
  // 🔪 备菜类
  cut: { label: "切", icon: "🔪", type: "prep", params: ["ingredient", "shape", "duration"] },
  wash: { label: "洗", icon: "💧", type: "prep", params: ["ingredient", "duration"] },
  marinate: { label: "腌制", icon: "🥣", type: "prep", params: ["ingredient", "condiment", "duration"] },
  mix: { label: "混合", icon: "🔄", type: "prep", params: ["ingredients", "tool", "duration"] },
  
  // 🍳 炉灶烹饪
  stir_fry: { label: "炒", icon: "🍳", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
  boil: { label: "煮", icon: "🍲", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
  steam: { label: "蒸", icon: "♨️", type: "cook", params: ["ingredients", "duration", "tool"] },
  fry: { label: "煎/炸", icon: "🍤", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
  stew: { label: "炖/焖", icon: "🥘", type: "cook", params: ["ingredients", "heat", "duration", "tool"] },
  
  // 🌡️ 烤箱/设备
  bake: { label: "烘烤", icon: "🍰", type: "cook", params: ["ingredients", "temp", "duration", "tool"] },
  
  // 🍽️ 其他
  plate: { label: "摆盘", icon: "🍽️", type: "serve", params: ["duration"] },
  rest: { label: "静置", icon: "⏳", type: "wait", params: ["duration"] },
} as const

export type ActionKey = keyof typeof ACTIONS

export const SHAPES = [
  { value: "slice", label: "片" },
  { value: "strip", label: "丝" },
  { value: "cube", label: "块/丁" },
  { value: "mince", label: "末/泥" },
  { value: "chunk", label: "滚刀块" },
  { value: "whole", label: "整只" },
] as const
