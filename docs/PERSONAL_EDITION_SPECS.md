# Chef's Manual - 个人版功能规格说明书

本文档详细描述了 **Chef's Manual (个人版)** 的所有已实现功能、业务逻辑、数据架构及技术细节。旨在为开发者、维护者及利益相关者提供项目的全景视图。

---

## 1. 项目概览

**Chef's Manual** 是一个面向家庭厨师的高级烹饪辅助系统（Kitchen OS）。它不仅仅是一个食谱记录工具，更是一个利用智能算法解决“多菜同做”调度难题的生产力工具。

- **核心价值**：将复杂的厨房任务并行化，生成最优化的时间轴，让用户像专业主厨一样从容应对多道菜的烹饪。
- **目标用户**：希望提升烹饪效率、挑战复杂家宴或追求厨房秩序感的烹饪爱好者。
- **双模式 UI**：
  - **Personal (默认)**：温馨的米色/橙色调，强调生活感与食欲。
  - **Business (专业)**：赛博朋克/暗黑风格，强调数据与精准控制 (UI 切换仅影响视觉，逻辑共享)。

---

## 2. 核心功能模块详解

### 2.1. 控制台 (Dashboard)
用户的中央指挥中心，提供核心功能的快捷入口与数据概览。

- **欢迎区域**：根据时间问候用户，显示当前模式（Personal/Business）。
- **功能卡片 (Bento Grid 布局)**：
  1.  **快速开始 (Initiate Session)**：引导用户进入烹饪会话配置页面。
  2.  **周度统计 (Weekly Stats)**：展示本周完成的烹饪次数。
  3.  **累计节省时间 (Total Time Saved)**：基于智能调度算法，统计对比串行烹饪所节省的总时间。
  4.  **我的菜谱 (Database)**：展示最近编辑的 3 个菜谱，支持快速编辑和新建。
  5.  **推荐组合 (Optimized Set)**：智能推荐算法，根据现有菜谱生成“主菜+汤+配菜”的均衡组合，支持一键开始。
  6.  **烹饪历史 (Session Logs)**：列出最近完成的 2 次烹饪记录，点击可查看详细报告。
  7.  **菜单生成器 (Menu Asset Gen)**：跳转至菜单图片生成工具。

### 2.2. 食谱管理 (Recipe Management)
结构化的食谱数据录入与管理系统。

- **结构化数据**：不同于传统文本，食谱被拆解为 `Ingredients` (食材) 和 `Steps` (步骤)。
- **步骤元数据**：每个步骤包含以下关键属性，供调度器使用：
  - `duration`: 时长（秒）。
  - `type`: 类型（Prep备菜 / Cook烹饪 / Wait等待 / Serve装盘）。
  - `equipment`: 所需设备（Wok / Oven / Board 等）。
  - `is_active`: 是否需要人手持续参与（决定了能否并行）。
  - `is_interruptible`: 是否可打断。
- **创建/编辑流程**：分步向导 (Wizard) 形式，依次录入基础信息、食材、步骤。

### 2.3. 智能调度系统 (Scheduler Core)
项目的“大脑”，位于 `src/lib/scheduler.ts`。

- **调度模式切换 (Scheduling Modes) [新增]**：
  - **从容模式 (Relaxed, 默认)**：采用“备料前置”策略 (Prep-First)。强制将所有切配任务安排在开火之前，并在烹饪开始前插入缓冲期，符合 *Mise en place* 哲学，减少烹饪时的手忙脚乱。
  - **激进模式 (Aggressive)**：极限穿插策略。允许在烹饪间隙（如炖煮时）插入切配任务，追求时间利用率最大化。
- **认知负荷管理 (Cognitive Load) [新增]**：
  - **惯性奖励 (Inertia Reward)**：算法会优先将同类型任务（如连续切菜）或同设备任务（如连续用锅）安排在一起，减少上下文切换带来的疲劳感。
- **资源管理 (Resource Awareness)**：
  - **Chef (厨师注意力)**：默认容量 1.0。
  - **Stove (灶台)**：默认 2 个炉头。
  - **Oven (烤箱)**：默认 1 个。
- **任务合并 (Optimization)**：自动扫描多道菜的备菜步骤（如“切葱”、“切姜”），将其合并为一个统一的 `Prep Task`，减少切换成本。

### 2.4. 实时烹饪导航 (Live Session)
执行计划的“厨房 GPS”，位于 `src/app/session/live`。

- **交互体验重构 (UX 2.0) [新增]**：
  - **智能空闲界面 (Smart Idle Screen)**：当厨师暂无任务时，不再显示枯燥的加载圈，而是展示“下一任务预告”和倒计时，并提供“提前开始”选项，消除等待焦虑。
  - **上下文提示 (Contextual Tips)**：根据任务关键词（如“爆炒”、“煎牛排”）自动展示贴心的烹饪建议（如“注意火候”、“不要频繁翻动”）。
- **智能烹饪转盘 (Smart Cooking Dial) [新增]**：
  - **可视化进度**：中央大圆环展示任务进度，通过颜色区分任务类型（绿=Prep, 橙=Cook, 蓝=Wait）。
  - **长按跳过 (Long Press to Skip)**：按住圆环可强制结束当前步骤（解决“提前熟了”的场景）。
  - **灵活加时**：倒计时结束后，提供“+1分钟”和“下一步”的双分支选择。
- **时间轴视图**：以甘特图形式预览整体流程。
- **双人协同**：支持主厨/帮厨分屏显示，任务依赖自动解锁。

### 2.5. 菜单生成器 (Menu Generator)
社交分享工具，位于 `src/app/menu-generator`。

- **所见即所得 (WYSIWYG)**：左侧勾选菜品，右侧实时预览。
- **艺术模版**：
  - 复古双层边框设计。
  - 自动排版菜品名称与分类。
  - 底部包含 "CHEF'S MANUAL" 品牌标识与 "Curated by {User}" 签名。
- **图片导出**：利用 `html2canvas` 技术，一键生成高清 PNG 图片。

### 2.6. 结案报告 (Completion Page)
烹饪完成后的反馈页面，位于 `src/app/session/complete`。

- **庆祝动画**：Confetti 礼花效果。
- **数据总结**：展示实际耗时、效率提升百分比。
- **分享功能**：一键复制文本摘要分享。

### 2.7. 算法控制台 (Admin Panel)
系统的参数配置中心，位于 `/admin` (访问密码: `0806`)。

- **功能价值**：允许管理员微调算法的核心参数，无需修改代码即可改变调度行为。
- **主要模块**：
  - **行动定义 (Actions)**：细粒度管理 90+ 种烹饪动作。
  - **菜品分类 (Categories)**：管理分类优先级和时间偏移。
  - **元数据管理 (Metadata)**：自定义计量单位、菜系、难度等级等。

---

## 3. 数据架构 (Supabase)

项目使用 **Supabase (PostgreSQL)** 作为后端数据库，主要表结构如下：

### 3.1. 业务数据表
- **`recipes`**：食谱元数据。
- **`recipe_ingredients`**：食材清单。
- **`recipe_steps`**：具体步骤。
- **`cooking_sessions`**：历史烹饪记录。

### 3.2. 系统配置表 (System Config)
- **`sys_algorithm_actions`**：动作定义。
- **`sys_dish_categories`**：分类规则。
- **`sys_measurement_units`**：计量单位。
- **`sys_cuisines`**：菜系。
- **`sys_difficulty_levels`**：难度等级。

---

## 4. 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4.0
- **后端/Auth**: Supabase (Client/Server Actions)
- **图标**: Lucide React
- **绘图**: html2canvas, canvas-confetti
- **状态管理**: React Context + LocalStorage
- **交互组件**: Custom SVG (Smart Dial), Framer Motion (Animations)

## 5. 目录结构关键点

```
src/
├── app/
│   ├── dashboard/       # 控制台
│   ├── session/         # 烹饪会话配置
│   │   ├── live/        # 实时执行页面 (Core - Updated UX)
│   │   └── page.tsx     # 调度预览与模式选择
│   ├── admin/           # 算法参数控制台
│   └── ...
├── lib/
│   ├── scheduler.ts     # 核心调度算法 (含 Relaxed Mode & Inertia Reward)
│   └── ...
└── components/
    └── SmartCookingDial.tsx # [新增] 智能烹饪控制组件
```

---

*文档最后更新时间: 2025-12-09*
