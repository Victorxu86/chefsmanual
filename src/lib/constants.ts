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

export const SHAPES = [
  { value: "slice", label: "片" },
  { value: "strip", label: "丝" },
  { value: "cube", label: "丁/块" },
  { value: "mince", label: "末/蓉" },
  { value: "chunk", label: "滚刀块" },
  { value: "ring", label: "圈" },
  { value: "flower", label: "花刀" },
  { value: "segment", label: "段" },
  { value: "whole", label: "整只" },
] as const

// === 全量动作体系 (Complete Action Hierarchy) ===

export type ActionDefinition = {
  id: string
  label: string
  icon: string // 虽然你说可以不用emoji，但在UI上做分类标识还是很有用的，我会简化使用
  type: "prep" | "cook" | "wait" | "serve"
  params: string[] // "ingredient", "ingredients", "heat", "tool", "duration", "shape", "condiment", "temp"
}

// 辅助生成函数
const createAction = (label: string, type: ActionDefinition['type'], params: string[], icon: string = "•"): ActionDefinition => {
  // 简单的 ID 生成逻辑 (实际项目可能需要更严谨的 ID)
  const id = label
  return { id, label, type, params, icon }
}

// 定义层级结构
export const ACTION_HIERARCHY = [
  {
    id: "heat",
    label: "加热/烹调",
    icon: "🔥",
    categories: [
      {
        id: "stir_fry",
        label: "炒",
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
        label: "煎",
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
        label: "炸",
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
        id: "roast",
        label: "烤",
        actions: [
          createAction("明火烤", "cook", ["ingredients", "heat", "tool", "duration"], "🍢"),
          createAction("炭火烤", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("铁板烤", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("烤箱烤", "cook", ["ingredients", "temp", "tool", "duration"], "⏲️"),
          createAction("烤架烤", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("烧烤", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("炙烤", "cook", ["ingredients", "heat", "tool", "duration"]),
        ]
      },
      {
        id: "bake",
        label: "烘焙",
        actions: [
          createAction("烘烤", "cook", ["ingredients", "temp", "tool", "duration"], "🍰"),
          createAction("热风烤", "cook", ["ingredients", "temp", "tool", "duration"]),
          createAction("上下火烤", "cook", ["ingredients", "temp", "tool", "duration"]),
          createAction("焗烤", "cook", ["ingredients", "temp", "tool", "duration"]),
          createAction("焗", "cook", ["ingredients", "temp", "tool", "duration"]),
          createAction("风干烤", "cook", ["ingredients", "temp", "tool", "duration"]),
          createAction("预烤", "cook", ["ingredients", "temp", "tool", "duration"]),
        ]
      },
      {
        id: "steam",
        label: "蒸",
        actions: [
          createAction("清蒸", "cook", ["ingredients", "tool", "duration"], "♨️"),
          createAction("隔水蒸", "cook", ["ingredients", "tool", "duration"]),
          createAction("旺火蒸", "cook", ["ingredients", "tool", "duration"]),
          createAction("中火蒸", "cook", ["ingredients", "tool", "duration"]),
          createAction("小火蒸", "cook", ["ingredients", "tool", "duration"]),
          createAction("蒸至熟", "cook", ["ingredients", "tool", "duration"]),
          createAction("蒸至定型", "cook", ["ingredients", "tool", "duration"]),
          createAction("回蒸", "cook", ["ingredients", "tool", "duration"]),
        ]
      },
      {
        id: "boil",
        label: "煮",
        actions: [
          createAction("煮", "cook", ["ingredients", "heat", "tool", "duration"], "🍲"),
          createAction("汆", "cook", ["ingredients", "tool", "duration"]),
          createAction("焯水", "cook", ["ingredients", "tool", "duration"], "💧"),
          createAction("飞水", "cook", ["ingredients", "tool", "duration"]),
          createAction("滚煮", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("小火慢煮", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("煮沸转小火", "cook", ["ingredients", "heat", "tool", "duration"]),
        ]
      },
      {
        id: "braise",
        label: "焖/炖/煨",
        actions: [
          createAction("焖", "cook", ["ingredients", "heat", "tool", "duration"], "🥘"),
          createAction("焖煮", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("盖盖焖", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("焖至收汁", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("焖至软烂", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("炖", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("文火慢炖", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("隔水炖", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("高压炖", "cook", ["ingredients", "tool", "duration"]),
          createAction("小火煨煮", "cook", ["ingredients", "heat", "tool", "duration"]),
          createAction("砂锅煨", "cook", ["ingredients", "heat", "tool", "duration"]),
        ]
      },
      {
        id: "liquid_temp",
        label: "液体与控温",
        actions: [
          createAction("预热锅", "prep", ["tool", "duration"]),
          createAction("预热油", "prep", ["tool", "duration"]),
          createAction("预热烤箱", "prep", ["tool", "temp", "duration"]),
          createAction("开大火", "cook", ["tool"]),
          createAction("转中火", "cook", ["tool"]),
          createAction("转小火", "cook", ["tool"]),
          createAction("关火", "cook", ["tool"]),
          createAction("焖火", "wait", ["tool", "duration"]),
          createAction("加水", "cook", ["tool", "amount"]),
          createAction("加冷水", "cook", ["tool", "amount"]),
          createAction("加热水", "cook", ["tool", "amount"]),
          createAction("加高汤", "cook", ["tool", "amount"]),
          createAction("加冰块", "cook", ["tool", "amount"]),
          createAction("煮沸", "cook", ["tool", "duration"]),
          createAction("保持微沸", "cook", ["tool", "duration"]),
          createAction("保温", "wait", ["tool", "duration"]),
          createAction("冷却", "wait", ["tool", "duration"]),
          createAction("冰镇", "wait", ["tool", "duration"]),
          createAction("回温", "wait", ["tool", "duration"]),
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
          createAction("浸泡", "prep", ["ingredient", "duration"]),
          createAction("漂洗", "prep", ["ingredient", "duration"]),
          createAction("盐水浸泡", "prep", ["ingredient", "duration"]),
          createAction("挑拣", "prep", ["ingredient", "duration"]),
          createAction("去根/皮/核", "prep", ["ingredient", "duration"]),
          createAction("去籽/蒂", "prep", ["ingredient", "duration"]),
          createAction("去筋/膜", "prep", ["ingredient", "duration"]),
          createAction("剔骨/刺", "prep", ["ingredient", "duration"]),
          createAction("去虾线", "prep", ["ingredient", "duration"]),
          createAction("去内脏", "prep", ["ingredient", "duration"]),
          createAction("剁段", "prep", ["ingredient", "duration"]),
          createAction("拆分", "prep", ["ingredient", "duration"]),
        ]
      },
      {
        id: "cut",
        label: "切工",
        actions: [
          createAction("切片", "prep", ["ingredient", "shape", "duration"], "🔪"),
          createAction("切丝", "prep", ["ingredient", "shape", "duration"]),
          createAction("切丁", "prep", ["ingredient", "shape", "duration"]),
          createAction("切块", "prep", ["ingredient", "shape", "duration"]),
          createAction("切条", "prep", ["ingredient", "shape", "duration"]),
          createAction("切末", "prep", ["ingredient", "shape", "duration"]),
          createAction("剁碎", "prep", ["ingredient", "shape", "duration"]),
          createAction("剁蓉", "prep", ["ingredient", "shape", "duration"]),
          createAction("滚刀切", "prep", ["ingredient", "shape", "duration"]),
          createAction("菱形块", "prep", ["ingredient", "shape", "duration"]),
          createAction("斜切", "prep", ["ingredient", "shape", "duration"]),
          createAction("切圈", "prep", ["ingredient", "shape", "duration"]),
          createAction("切花刀", "prep", ["ingredient", "shape", "duration"]),
          createAction("拍碎", "prep", ["ingredient", "duration"], "🔨"),
          createAction("拍松", "prep", ["ingredient", "duration"]),
          createAction("压扁", "prep", ["ingredient", "duration"]),
          createAction("碾碎", "prep", ["ingredient", "duration"]),
          createAction("整形", "prep", ["ingredient", "duration"]),
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
          createAction("翻拌", "prep", ["ingredients", "tool", "duration"]),
          createAction("调和", "prep", ["ingredients", "tool", "duration"]),
          createAction("合并", "prep", ["ingredients", "tool", "duration"]),
          createAction("打发", "prep", ["ingredients", "tool", "duration"], "🌪️"),
          createAction("打至湿性发泡", "prep", ["ingredients", "tool", "duration"]),
          createAction("打至干性发泡", "prep", ["ingredients", "tool", "duration"]),
          createAction("乳化", "prep", ["ingredients", "tool", "duration"]),
          createAction("打散", "prep", ["ingredients", "tool", "duration"]),
          createAction("抓匀", "prep", ["ingredients", "duration"]),
          createAction("过筛", "prep", ["ingredients", "tool", "duration"]),
          createAction("过滤", "prep", ["ingredients", "tool", "duration"]),
        ]
      },
      {
        id: "season",
        label: "腌制/调味",
        actions: [
          createAction("腌制", "prep", ["ingredient", "condiment", "duration"], "🏺"),
          createAction("腌渍", "prep", ["ingredient", "condiment", "duration"]),
          createAction("抹盐/糖", "prep", ["ingredient", "condiment", "duration"]),
          createAction("静置腌制", "prep", ["ingredient", "duration"]),
          createAction("加盐/糖/酱", "cook", ["ingredients", "condiment"]),
          createAction("撒盐/粉", "cook", ["ingredients", "condiment"]),
          createAction("淋油/汁", "cook", ["ingredients", "condiment"]),
          createAction("调味", "cook", ["ingredients"]),
        ]
      },
      {
        id: "coat",
        label: "挂糊/勾芡",
        actions: [
          createAction("裹粉", "prep", ["ingredient", "condiment"], "🍞"),
          createAction("裹淀粉", "prep", ["ingredient", "condiment"]),
          createAction("裹浆", "prep", ["ingredient", "condiment"]),
          createAction("挂糊", "prep", ["ingredient", "condiment"]),
          createAction("拍粉", "prep", ["ingredient", "condiment"]),
          createAction("勾芡", "cook", ["ingredients", "condiment", "duration"]),
          createAction("收汁", "cook", ["ingredients", "heat", "duration"]),
          createAction("收干", "cook", ["ingredients", "heat", "duration"]),
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
        label: "面团/成型",
        actions: [
          createAction("和面", "prep", ["ingredients", "duration"], "👐"),
          createAction("揉面", "prep", ["ingredients", "duration"]),
          createAction("醒面", "wait", ["ingredients", "duration"]),
          createAction("发酵", "wait", ["ingredients", "duration"]),
          createAction("擀面", "prep", ["ingredients", "duration"]),
          createAction("包馅", "prep", ["ingredients", "duration"]),
          createAction("捏褶", "prep", ["ingredients", "duration"]),
          createAction("搓圆", "prep", ["ingredients", "duration"]),
          createAction("压模", "prep", ["ingredients", "duration"]),
        ]
      },
      {
        id: "plate",
        label: "摆盘/完成",
        actions: [
          createAction("装盘", "serve", ["ingredients"], "🍽️"),
          createAction("铺底", "serve", ["ingredients"]),
          createAction("码放", "serve", ["ingredients"]),
          createAction("点缀", "serve", ["ingredients"]),
          createAction("淋汁", "serve", ["ingredients"]),
          createAction("擦边", "serve", ["tool"]),
        ]
      },
      {
        id: "check",
        label: "检查/判断",
        actions: [
          createAction("观察颜色", "cook", ["ingredients"], "👁️"),
          createAction("检查质地", "cook", ["ingredients"]),
          createAction("试熟度", "cook", ["ingredients"]),
          createAction("品尝", "cook", ["ingredients"], "👅"),
          createAction("测温", "cook", ["ingredients", "tool"]),
        ]
      },
      {
        id: "store",
        label: "保存/冷冻",
        actions: [
          createAction("冷藏", "wait", ["ingredients", "duration"], "❄️"),
          createAction("冷冻", "wait", ["ingredients", "duration"]),
          createAction("回温", "wait", ["ingredients", "duration"]),
          createAction("冰镇", "wait", ["ingredients", "duration"]),
        ]
      }
    ]
  },
  {
    id: "equip",
    label: "设备/清理",
    icon: "⚙️",
    categories: [
      {
        id: "clean_tool",
        label: "清理",
        actions: [
          createAction("清洗锅具", "prep", ["tool"], "🧽"),
          createAction("整理台面", "prep", ["tool"]),
          createAction("垃圾处理", "prep", ["tool"]),
        ]
      },
      {
        id: "operate",
        label: "设备操作",
        actions: [
          createAction("开火", "cook", ["tool"]),
          createAction("关火", "cook", ["tool"]),
          createAction("打开烤箱", "cook", ["tool"]),
          createAction("设置计时器", "cook", ["tool", "duration"]),
          createAction("启动搅拌机", "cook", ["tool"]),
        ]
      }
    ]
  }
] as const

// 扁平化的动作映射表 (用于快速查找)
export const ACTIONS: Record<string, ActionDefinition> = {}

// Populate the flat ACTIONS map
// @ts-ignore
ACTION_HIERARCHY.forEach(realm => {
  // @ts-ignore
  realm.categories.forEach(category => {
    // @ts-ignore
    category.actions.forEach(action => {
      // @ts-ignore
      ACTIONS[action.label] = action // Use label as ID for easier matching if needed, or use generated ID
      // @ts-ignore
      ACTIONS[action.id] = action
    })
  })
})

export type ActionKey = keyof typeof ACTIONS
