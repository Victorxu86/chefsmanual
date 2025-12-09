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

- **倒序排课算法 (Reverse Scheduling)**：以“开饭时间”为锚点，反向推导每道菜的开始时间，确保热菜刚出锅、凉菜已备好。
- **资源管理 (Resource Awareness)**：
  - **Chef (厨师注意力)**：默认容量 1.0。如果是“切菜”需 100% 占用，如果是“炖煮”仅需 20% 占用。
  - **Stove (灶台)**：默认 2 个炉头（支持区分猛火/普通）。
  - **Oven (烤箱)**：默认 1 个。
- **任务合并 (Optimization)**：自动扫描多道菜的备菜步骤（如“切葱”、“切姜”），将其合并为一个统一的 `Prep Task`，减少切换成本。
- **冲突检测**：确保同一时间点的资源需求不超过物理限制。

### 2.4. 实时烹饪导航 (Live Session)
执行计划的“厨房 GPS”，位于 `src/app/session/live`。

- **时间轴视图**：以时间流形式展示当前应执行的任务。
- **交互控制**：
  - **倒计时**：实时显示剩余时间。
  - **完成确认**：点击完成当前步骤，自动解锁依赖的后续步骤。
  - **撤销 (Undo)**：误操作可撤回。
  - **强制开始 (Force Start)**：跳过等待时间，立即执行。
- **状态恢复**：利用 `LocalStorage` 缓存进度，防止刷新丢失。
- **自动结案**：所有任务完成后，自动将 Session 数据写入数据库并跳转至庆祝页面。

### 2.5. 菜单生成器 (Menu Generator)
社交分享工具，位于 `src/app/menu-generator`。

- **所见即所得 (WYSIWYG)**：左侧勾选菜品，右侧实时预览。
- **艺术模版**：
  - 复古双层边框设计。
  - 自动排版菜品名称与分类。
  - 底部包含 "CHEF'S MANUAL" 品牌标识与 "Curated by {User}" 签名。
- **图片导出**：利用 `html2canvas` 技术，一键生成高清 PNG 图片，解决 CSS 颜色兼容性问题。

### 2.6. 结案报告 (Completion Page)
烹饪完成后的反馈页面，位于 `src/app/session/complete`。

- **庆祝动画**：Confetti 礼花效果。
- **数据总结**：展示实际耗时、效率提升百分比。
- **分享功能**：一键复制文本摘要分享。

### 2.7. 算法控制台 (Admin Panel) [新增]
系统的参数配置中心，位于 `/admin` (访问密码: `0806`)。将算法从“硬编码”进化为“数据驱动”。

- **功能价值**：允许管理员微调算法的核心参数，无需修改代码即可改变调度行为。
- **主要模块**：
  - **行动定义 (Actions)**：细粒度管理 90+ 种烹饪动作（如“爆炒”、“慢炖”、“切丁”）。
    - 可配置参数：`Type` (类型), `Load` (注意力负载 0-1), `Active` (是否需人手), `Affinity` (亲和力分组)。
  - **菜品分类 (Categories)**：管理“热菜”、“凉菜”等分类的调度优先级和上菜时间偏移量。
  - **元数据管理 (Metadata)**：自定义计量单位、菜系、难度等级等。
- **技术实现**：基于 Server Actions 和 Cookie Session 的独立认证系统，直接读写 `sys_` 开头的系统表。

---

## 3. 数据架构 (Supabase)

项目使用 **Supabase (PostgreSQL)** 作为后端数据库，主要表结构如下：

### 3.1. 业务数据表
- **`recipes` (食谱表)**：存储食谱元数据 (title, cuisine, difficulty...)。
- **`recipe_ingredients` (食材表)**：食谱关联的食材清单。
- **`recipe_steps` (步骤表)**：食谱关联的具体步骤 (instruction, duration, equipment...)。
- **`cooking_sessions` (会话表)**：用户的历史烹饪记录 (duration, status...)。

### 3.2. 系统配置表 (System Config) [新增]
用于驱动算法和 Admin 后台的元数据表：
- **`sys_algorithm_actions`**：存储动作定义。
  - `id`, `category` (大类), `subcategory` (子类), `label` (名称), `keywords` (匹配词), `default_load` (负载), `is_active` (主动性), `affinity_group` (分组)。
- **`sys_dish_categories`**：存储菜品分类规则。
  - `slug`, `label`, `schedule_priority` (优先级), `end_time_offset` (时间偏移)。
- **`sys_measurement_units`**：计量单位字典 (克, 勺, 个)。
- **`sys_cuisines`**：菜系字典 (川菜, 法餐)。
- **`sys_difficulty_levels`**：难度等级字典 (简单, 困难)。

---

## 4. 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS 4.0
- **后端/Auth**: Supabase (Client/Server Actions)
- **图标**: Lucide React
- **绘图**: html2canvas, canvas-confetti
- **状态管理**: React Context (ModeContext) + LocalStorage (Session Recovery)
- **Admin Auth**: Cookie-based Session (独立于 Supabase Auth 的轻量级管理鉴权)

## 5. 目录结构关键点

```
src/
├── app/
│   ├── dashboard/       # 控制台 (Server Component + Client Content)
│   ├── menu-generator/  # 菜单生成器
│   ├── recipes/         # 食谱列表与详情
│   ├── create-recipe/   # 食谱创建向导
│   ├── session/         # 烹饪会话配置
│   │   ├── live/        # 实时执行页面 (Core)
│   │   └── complete/    # 结案页面
│   ├── login/           # 用户认证
│   └── admin/           # [新增] 算法参数控制台
│       ├── login/       # Admin 独立登录
│       └── actions.ts   # Admin Server Actions
├── lib/
│   ├── scheduler.ts     # 核心调度算法 (The Brain)
│   ├── constants.ts     # 前端常量 (逐步迁移至数据库驱动)
│   └── database.types.ts # Supabase 类型定义
└── components/          # UI 组件
```

---

*文档最后更新时间: 2025-12-07*
