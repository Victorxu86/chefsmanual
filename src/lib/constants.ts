// 预设字典库

export const RECIPE_CATEGORIES = [
  { value: "main", label: "热菜/主菜", description: "必须对齐开饭时间" },
  { value: "staple", label: "主食", description: "通常可保温" },
  { value: "soup", label: "汤/炖菜", description: "可提前完成，保温" },
  { value: "cold", label: "凉菜", description: "可提前很久完成" },
  { value: "dessert", label: "甜品", description: "饭后食用" },
  { value: "drink", label: "饮品", description: "随时" },
] as const

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
  { value: "mixer", label: "厨师机/和面机", station: "counter" },
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
  { value: "fruit", label: "水果" }, // 添加水果分类
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

// 形状字典 (补回)
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

// === 全量动作体系 (Complete Action Hierarchy) ===

export type ActionDefinition = {
  id: string
  label: string
  icon: string
  type: "prep" | "cook" | "wait" | "serve"
  params: string[]
  forcePassive?: boolean
}

const createAction = (label: string, type: ActionDefinition['type'], params: string[], icon: string = "•", forcePassive: boolean = false): ActionDefinition => {
  const id = label
  return { id, label, type, params, icon, forcePassive }
}

// ... (ACTION_HIERARCHY 保持不变，为了节省token，我这里用 ... 表示，但实际write时必须完整)
export const ACTION_HIERARCHY = [
  {
    id: "heat",
    label: "加热/烹调",
    icon: "🔥",
    categories: [
      {
        id: "stir_fry",
        label: "炒 (Active)",
        actions: [
          createAction("炒", "cook", ["ingredients", "heat", "tool", "duration"], "🍳"),
          createAction("快炒", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("爆炒", "cook", ["ingredients", "heat", "tool", "duration"], "💥"),
          createAction("煸炒", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("干煸", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("清炒", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("翻炒", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("收炒", "cook", ["ingredients", "heat", "tool", "duration"]),
        ]
      },
      {
        id: "pan_fry",
        label: "煎 (Active)",
        actions: [
          createAction("煎", "cook", ["ingredients", "heat", "tool", "duration"], "🥘"),
          createAction("煎封", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("小火慢煎", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("平底锅煎", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("煎至金黄", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("煎至定型", "cook", ["ingredients", "heat", "tool", "duration"]),
        ]
      },
      {
        id: "deep_fry",
        label: "炸 (Active)",
        actions: [
          createAction("油炸", "cook", ["ingredients", "heat", "tool", "duration"], "🍤"),
          createAction("深炸", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("浅炸", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("复炸", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("酥炸", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("裹粉炸", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("裹糊炸", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("半煎炸", "cook", ["ingredients", "heat", "tool", "duration"]),
        ]
      },
      {
        id: "roast_bake",
        label: "烤/烘焙 (Passive)",
        actions: [
          createAction("烤箱烤", "cook", ["ingredients", "temp", "tool", "duration"], "⏲️", true),
          createAction("烘烤", "cook", ["ingredients", "temp", "tool", "duration"], "🍰", true),
          createAction("热风烤", "cook", ["ingredients", "temp", "tool", "duration"], "🌬️", true),
          createAction("上下火烤", "cook", ["ingredients", "temp", "tool", "duration"], "🔥", true),
          createAction("焗烤", "cook", ["ingredients", "temp", "tool", "duration"], "🧀", true),
          createAction("风干烤", "cook", ["ingredients", "temp", "tool", "duration"], "🍂", true),
          createAction("预烤", "cook", ["ingredients", "temp", "tool", "duration"], "🥧", true),
        ]
      },
      {
        id: "steam",
        label: "蒸 (Passive)",
        actions: [
          createAction("清蒸", "cook", ["ingredients", "tool", "duration"], "♨️", true),
          createAction("隔水蒸", "cook", ["ingredients", "tool", "duration"], "💧", true),
          createAction("旺火蒸", "cook", ["ingredients", "tool", "duration"], "🔥", true),
          createAction("中火蒸", "cook", ["ingredients", "tool", "duration"], "🔥", true),
          createAction("小火蒸", "cook", ["ingredients", "tool", "duration"], "🔥", true),
          createAction("蒸至熟", "cook", ["ingredients", "tool", "duration"], "✅", true),
          createAction("蒸至定型", "cook", ["ingredients", "tool", "duration"], "📏", true),
        ]
      },
      {
        id: "boil_active",
        label: "煮/焯 (Active)",
        actions: [
          createAction("煮", "cook", ["ingredients", "heat", "tool", "duration"], "🍲"),
          createAction("汆", "cook", ["ingredients", "tool", "duration"]),
          createAction("焯水", "cook", ["ingredients", "tool", "duration"], "💧"),
          createAction("飞水", "cook", ["ingredients", "tool", "duration"]),
          createAction("滚煮", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("煮沸", "cook", ["tool", "duration"]),
        ]
      },
      {
        id: "stew_passive",
        label: "炖/焖/煨 (Passive)",
        actions: [
          createAction("焖", "cook", ["ingredients", "heat", "tool", "duration"], "🥘", true),
          createAction("焖煮", "cook", ["ingredients", "heat", "tool", "duration"], "🥘", true),
          createAction("盖盖焖", "cook", ["ingredients", "heat", "tool", "duration"], "🥘", true),
          createAction("炖", "cook", ["ingredients", "heat", "tool", "duration"], "🍲", true),
          createAction("文火慢炖", "cook", ["ingredients", "heat", "tool", "duration"], "🍲", true),
          createAction("隔水炖", "cook", ["ingredients", "heat", "tool", "duration"], "🍲", true),
          createAction("高压炖", "cook", ["ingredients", "tool", "duration"], "⏲️", true),
          createAction("小火煨煮", "cook", ["ingredients", "heat", "tool", "duration"], "🍵", true),
          createAction("砂锅煨", "cook", ["ingredients", "heat", "tool", "duration"], "🍵", true),
          createAction("小火慢煮", "cook", ["ingredients", "heat", "tool", "duration"], "🔥", true),
        ]
      },
      {
        id: "liquid_temp",
        label: "控温/预热",
        actions: [
          createAction("预热锅", "prep", ["tool", "duration"], "🍳"),
          createAction("预热油", "prep", ["tool", "duration"], "🛢️"),
          createAction("预热烤箱", "prep", ["tool", "temp", "duration"], "⏲️"),
          createAction("开大火", "cook", ["tool"], "🔥"),
          createAction("转中火", "cook", ["tool"], "🔥"),
          createAction("转小火", "cook", ["tool"], "🔥"),
          createAction("关火", "cook", ["tool"], "🚫"),
          createAction("保温", "wait", ["tool", "duration"], "🌡️", true),
          createAction("冷却", "wait", ["tool", "duration"], "❄️", true),
          createAction("冰镇", "wait", ["tool", "duration"], "🧊", true),
          createAction("回温", "wait", ["tool", "duration"], "🌡️", true),
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
        id: "clean",
        label: "清洗/处理",
        actions: [
          createAction("清洗", "prep", ["ingredient", "duration"], "💧"),
          createAction("冲洗", "prep", ["ingredient", "duration"]),
          createAction("浸泡", "prep", ["ingredient", "duration"], "🥣", true), // 浸泡通常不需要一直看着
          createAction("漂洗", "prep", ["ingredient", "duration"]),
          createAction("盐水浸泡", "prep", ["ingredient", "duration"], "🧂", true),
          createAction("挑拣", "prep", ["ingredient", "duration"]),
          createAction("去根/皮/核", "prep", ["ingredient", "duration"]),
          createAction("剔骨/刺", "prep", ["ingredient", "duration"]),
          createAction("去虾线", "prep", ["ingredient", "duration"]),
        ]
      },
      {
        id: "cut",
        label: "切工 (Active)",
        actions: [
          createAction("切片", "prep", ["ingredient", "shape", "duration"], "🔪"),
          createAction("切丝", "prep", ["ingredient", "shape", "duration"]),
          createAction("切丁", "prep", ["ingredient", "shape", "duration"]),
          createAction("切块", "prep", ["ingredient", "shape", "duration"]),
          createAction("剁碎", "prep", ["ingredient", "shape", "duration"]),
          createAction("拍碎", "prep", ["ingredient", "duration"], "🔨"),
          createAction("拍松", "prep", ["ingredient", "duration"]),
          createAction("压扁", "prep", ["ingredient", "duration"]),
        ]
      }
    ]
  },
  {
    id: "mix_season",
    label: "混合/腌制",
    icon: "🥣",
    categories: [
      {
        id: "mix",
        label: "混合/搅拌",
        actions: [
          createAction("搅拌", "prep", ["ingredients", "tool", "duration"], "🔄"),
          createAction("拌匀", "prep", ["ingredients", "tool", "duration"]),
          createAction("打发", "prep", ["ingredients", "tool", "duration"], "🌪️"),
          createAction("抓匀", "prep", ["ingredients", "duration"]),
        ]
      },
      {
        id: "season",
        label: "腌制 (Passive)",
        actions: [
          createAction("腌制", "prep", ["ingredient", "condiment", "duration"], "🏺", true),
          createAction("腌渍", "prep", ["ingredient", "condiment", "duration"], "🏺", true),
          createAction("静置腌制", "prep", ["ingredient", "duration"], "⏳", true),
          createAction("抹盐/糖", "prep", ["ingredient", "condiment", "duration"]), // 这个动作本身是 Active
        ]
      }
    ]
  },
  {
    id: "dough_finish",
    label: "面点/收尾",
    icon: "🥟",
    categories: [
      {
        id: "dough",
        label: "面团",
        actions: [
          createAction("和面", "prep", ["ingredients", "duration"], "👐"),
          createAction("揉面", "prep", ["ingredients", "duration"]),
          createAction("醒面", "wait", ["ingredients", "duration"], "⏳", true),
          createAction("发酵", "wait", ["ingredients", "duration"], "🍞", true),
          createAction("擀面", "prep", ["ingredients", "duration"]),
          createAction("包馅", "prep", ["ingredients", "duration"]),
        ]
      },
      {
        id: "store",
        label: "保存/冷冻",
        actions: [
          createAction("冷藏", "wait", ["ingredients", "duration"], "❄️", true),
          createAction("冷冻", "wait", ["ingredients", "duration"], "🧊", true),
        ]
      }
    ]
  }
] as const

export const ACTIONS: Record<string, ActionDefinition> = {}

// @ts-ignore
ACTION_HIERARCHY.forEach(realm => {
  // @ts-ignore
  realm.categories.forEach(category => {
    // @ts-ignore
    category.actions.forEach(action => {
      // @ts-ignore
      ACTIONS[action.label] = action
      // @ts-ignore
      ACTIONS[action.id] = action
    })
  })
})

export type ActionKey = keyof typeof ACTIONS
