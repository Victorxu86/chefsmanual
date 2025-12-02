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

// 核心动作类型 (对应 step_type)
export const STEP_TYPES = [
  { value: "prep", label: "备菜 (Prep)" },
  { value: "cook", label: "烹饪 (Cook)" },
  { value: "wait", label: "等待 (Wait)" },
  { value: "serve", label: "摆盘 (Serve)" },
] as const

// 设备列表
export const EQUIPMENT = [
  // 炉灶类
  { value: "wok", label: "炒锅 (Wok)", station: "stove" },
  { value: "pan", label: "平底锅 (Pan)", station: "stove" },
  { value: "pot", label: "汤锅 (Pot)", station: "stove" },
  { value: "pressure_cooker", label: "压力锅", station: "stove" },
  
  // 烤箱类
  { value: "oven", label: "烤箱 (Oven)", station: "oven" },
  { value: "steamer", label: "蒸箱 (Steamer)", station: "oven" },
  { value: "microwave", label: "微波炉", station: "counter" },
  { value: "air_fryer", label: "空气炸锅", station: "counter" },
  
  // 备菜类
  { value: "board", label: "砧板 (Board)", station: "counter" },
  { value: "bowl", label: "大碗 (Bowl)", station: "counter" },
  
  // 其他
  { value: "sous_vide", label: "低温慢煮机", station: "counter" },
  { value: "blender", label: "搅拌机", station: "counter" },
] as const

// 火力/温度等级
export const HEAT_LEVELS = [
  { value: "low", label: "小火 / 文火" },
  { value: "medium_low", label: "中小火" },
  { value: "medium", label: "中火" },
  { value: "medium_high", label: "中大火" },
  { value: "high", label: "大火 / 爆炒" },
  { value: "off", label: "关火 / 余温" },
] as const

// 注意力等级
export const ATTENTION_LEVELS = [
  { value: "low", label: "无需照看 (Low)", description: "可以离开厨房" },
  { value: "medium", label: "间歇照看 (Medium)", description: "偶尔翻动一下" },
  { value: "high", label: "全程专注 (High)", description: "手不能停，眼不能离" },
] as const

// 食材分类
export const INGREDIENT_CATEGORIES = [
  { value: "vegetable", label: "蔬菜" },
  { value: "meat", label: "肉禽蛋" },
  { value: "seafood", label: "海鲜" },
  { value: "grain", label: "谷物/主食" },
  { value: "spice", label: "调料/香料" },
  { value: "dairy", label: "乳制品" },
  { value: "other", label: "其他" },
] as const

