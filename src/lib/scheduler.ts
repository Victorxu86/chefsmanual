import { ACTIONS, ActionKey } from "./constants"

// === 核心数据结构 ===

export interface SchedulerStep {
  id: string
  recipeId: string
  recipeColor: string 
  stepOrder: number
  instruction: string
  duration: number // 秒
  type: "prep" | "cook" | "wait" | "serve"
  isActive: boolean // 是否占用人手
  load?: number // 注意力负载 (0.0 - 1.0), 默认为 1.0 (全神贯注)
  equipment?: string // 占用特定设备
  temp?: number // 温度需求
  isInterruptible: boolean 
  // 原始动作Key，用于精准推断
  _actionKey?: string
}

export interface ScheduledBlock {
  step: SchedulerStep
  startTime: number // 相对开饭时间的秒数 (通常为负数)
  endTime: number
  lane: "chef" | "stove" | "oven" | "board" | "bowl" | "other"
  resourceId: string 
}

export type ScheduleMode = 'aggressive' | 'relaxed';

// 资源池定义
interface ResourcePool {
  chef: number 
  stove: number 
  oven: number
  board: number // 砧板
  bowl: number  // 料理碗
}

interface OccupiedSpan {
  start: number
  end: number
  load: number
  temp?: number
  metadata?: {
    type: string
    equipment?: string
    instruction?: string
  }
}

// 资源时间轴 (记录占用情况)
class ResourceTimeline {
  private occupied: OccupiedSpan[] = []
  public totalBookedTime: number = 0
  public capability?: string // e.g. "high_heat", "normal"

  constructor(capability?: string) {
    this.capability = capability
  }

  isAvailable(start: number, end: number, capacity: number, required: number, temp?: number, requiredCapability?: string): boolean {
    // 1. 检查能力是否匹配 (如果任务需要特定能力，而当前资源没有，直接不可用)
    if (requiredCapability && this.capability !== requiredCapability) {
        // 特殊情况：如果有 "high_heat" 能力的资源，可以兼容 "normal" 任务，反之不行
        // 但为了简单，先严格匹配，或者允许 high_heat 兼容无要求的任务
        if (requiredCapability === 'high_heat' && this.capability !== 'high_heat') return false
    }

    const overlaps = this.occupied.filter(interval => 
      !(interval.end <= start || interval.start >= end)
    )

    if (overlaps.length === 0) return true

    // 温度检查：如果当前请求有温度需求，且与任何重叠任务的温度不一致，则不可用
    if (temp !== undefined) {
      const conflict = overlaps.some(o => o.temp !== undefined && Math.abs(o.temp - temp) > 5) // 允许 5 度误差
      if (conflict) return false
    }

    const points = new Set<number>()
    points.add(start)
    points.add(end)
    overlaps.forEach(o => {
      points.add(Math.max(start, o.start))
      points.add(Math.min(end, o.end))
    })
    
    const sortedPoints = Array.from(points).sort((a, b) => a - b)
    
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i]
      const p2 = sortedPoints[i+1]
      if (p1 >= p2) continue
      
      let currentLoad = 0
      overlaps.forEach(o => {
        if (o.start <= p1 && o.end >= p2) {
          currentLoad += o.load
        }
      })
      
      // 核心修改：对于 Chef 资源，容量为 1.0 (代表 100% 注意力)
      // 如果是设备资源，容量通常是整数 (e.g. 1个炉头)
      // 我们统一用 capacity 参数，但在 Chef 调用时传入 1.0 即可
      // 注意：这里允许微小的浮点数误差
      if (currentLoad + required > capacity + 0.001) return false
    }

    return true
  }

  book(start: number, end: number, load: number, temp?: number, metadata?: OccupiedSpan['metadata']) {
    this.occupied.push({ start, end, load, temp, metadata })
    this.totalBookedTime += (end - start) * load
  }

  // Helper: Find the nearest task that starts AFTER (or exactly at) the given time
  getNearestFutureTask(time: number): OccupiedSpan | null {
    // Filter tasks that start >= time
    const futureTasks = this.occupied.filter(o => o.start >= time)
    if (futureTasks.length === 0) return null
    
    // Sort by start time ascending
    return futureTasks.sort((a, b) => a.start - b.start)[0]
  }

  // Helper: Get earliest start time of any task
  getEarliestStartTime(): number {
    if (this.occupied.length === 0) return 0
    return Math.min(...this.occupied.map(o => o.start))
  }
}

export class KitchenScheduler {
  private resources: ResourcePool
  private resourceStates: Record<string, ResourceTimeline[]> = {}
  private mode: ScheduleMode = 'relaxed' // Default to relaxed

  constructor(resources: Partial<ResourcePool> = {}, mode: ScheduleMode = 'relaxed') {
    this.resources = {
      chef: 1,
      stove: 2,
      oven: 1,
      board: 1,
      bowl: 2,
      ...resources
    }
    this.mode = mode
  }

  private initResourceStates() {
    this.resourceStates = {
      chef: Array(this.resources.chef).fill(null).map(() => new ResourceTimeline()),
      // 初始化灶台：如果有2个灶，第1个是猛火灶，第2个是普通灶
      stove: Array(this.resources.stove).fill(null).map((_, i) => new ResourceTimeline(i === 0 ? 'high_heat' : 'normal')),
      oven: Array(this.resources.oven).fill(null).map(() => new ResourceTimeline()),
      board: Array(this.resources.board).fill(null).map(() => new ResourceTimeline()),
      bowl: Array(this.resources.bowl).fill(null).map(() => new ResourceTimeline()),
    }
  }

  schedule(recipes: any[]): ScheduledBlock[] {
    this.initResourceStates()
    const outputBlocks: ScheduledBlock[] = []

    // 1. 预处理：备料合并 (Ingredient Merging)
    const mergedPrepSteps: any[] = []
    const processedRecipes = recipes.map(r => ({ ...r, steps: [...r.steps] })) // Deep copy steps

    // A. 提取可合并的步骤
    const prepGroups: Record<string, { recipeIndex: number, stepIndex: number, step: any }[]> = {}
    
    processedRecipes.forEach((recipe, rIdx) => {
      recipe.steps.forEach((step: any, sIdx: number) => {
        if (step.step_type !== 'prep') return
        
        // 识别关键词：切+食材名
        const match = step.instruction.match(/(切|洗|剥|拍)([\u4e00-\u9fa5]{1,2})/)
        if (match) {
          const key = match[0] // e.g. "切葱", "切姜"
          if (!prepGroups[key]) prepGroups[key] = []
          prepGroups[key].push({ recipeIndex: rIdx, stepIndex: sIdx, step })
        }
      })
    })

    // B. 执行合并
    Object.entries(prepGroups).forEach(([key, items]) => {
      if (items.length < 2) return // 只有一个就不合并

      // 1. 计算总时长
      const totalDuration = items.reduce((sum, item) => sum + item.step.duration_seconds, 0)
      const mergedDuration = Math.ceil(totalDuration * 0.7)

      // 2. 找到 "宿主" (Host)
      const hostItem = items[0]
      const hostRecipe = processedRecipes[hostItem.recipeIndex]
      const hostStep = hostRecipe.steps[hostItem.stepIndex]

      // 修改宿主步骤
      hostStep.instruction = `[统一] ${key} (共${items.length}道菜)`
      hostStep.duration_seconds = mergedDuration
      hostStep.is_active = true

      // 3. 废除其他步骤 (Guests)
      for (let i = 1; i < items.length; i++) {
        const guestItem = items[i]
        const guestRecipe = processedRecipes[guestItem.recipeIndex]
        const guestStep = guestRecipe.steps[guestItem.stepIndex]
        
        guestStep.instruction = `(已合并至${hostRecipe.title})`
        guestStep.duration_seconds = 0 
        guestStep.is_active = false
      }
    })

    const allTaskChains = processedRecipes.map((recipe, idx) => {
      const color = `hsl(${idx * 60}, 70%, 85%)` 
      const category = recipe.category || 'main'
      
      return {
        recipeId: recipe.id,
        category,
        steps: recipe.steps
          .filter((s: any) => s.duration_seconds > 0)
          .map((s: any) => {
          let isActive = s.is_active
          const actionEntry = Object.values(ACTIONS).find((a: any) => {
            if (s.instruction.includes(a.label)) return true
            if (a.id && s.instruction.toLowerCase().includes(a.id.toLowerCase())) return true
            return false
          })
          
          if (actionEntry && actionEntry.forcePassive !== undefined) {
            isActive = !actionEntry.forcePassive
          }

          return {
            id: s.id || Math.random().toString(),
            recipeId: recipe.id,
            recipeColor: color,
            stepOrder: s.step_order,
            instruction: s.instruction,
            duration: s.duration_seconds,
            type: s.step_type,
            isActive: isActive,
            equipment: s.equipment,
            temp: s.temperature_c, 
            isInterruptible: s.is_interruptible,
            _actionKey: (actionEntry as any)?.id
          } as SchedulerStep
        }).sort((a: any, b: any) => a.stepOrder - b.stepOrder)
      }
    })

    // 排序策略
    const priorityMap: Record<string, number> = {
      'main': 5,
      'staple': 4,
      'soup': 3,
      'cold': 2,
      'dessert': 1,
      'drink': 1
    }

    const sortedChains = allTaskChains.sort((a, b) => {
      const pA = priorityMap[a.category as string] || 3
      const pB = priorityMap[b.category as string] || 3
      if (pA !== pB) return pB - pA 
      
      const durationA = a.steps.reduce((sum: number, s: any) => sum + s.duration, 0)
      const durationB = b.steps.reduce((sum: number, s: any) => sum + s.duration, 0)
      return durationB - durationA
    })

    // === RELAXED MODE LOGIC ===
    // If Relaxed Mode is enabled, we split 'prep' steps from 'cook' steps.
    // We schedule 'cook' chains normally (reverse from dinnertime).
    // Then we schedule ALL 'prep' steps BEFORE the earliest cooking start time.
    
    // For Aggressive Mode (original), we schedule mixed chains directly.

    if (this.mode === 'relaxed') {
        // 1. Split chains into Cook-Only chains and Prep-Only pool
        const cookChains: any[] = []
        const prepTasks: { step: SchedulerStep, chainId: string }[] = []

        sortedChains.forEach(chain => {
            const cookSteps = chain.steps.filter((s: SchedulerStep) => s.type !== 'prep')
            const chainPrepSteps = chain.steps.filter((s: SchedulerStep) => s.type === 'prep')
            
            // Push prep steps to pool
            chainPrepSteps.forEach((s: SchedulerStep) => prepTasks.push({ step: s, chainId: chain.recipeId }))

            // Keep cook steps as chain (preserving order)
            if (cookSteps.length > 0) {
                cookChains.push({
                    ...chain,
                    steps: cookSteps
                })
            }
        })

        // 2. Schedule Cook Chains (Reverse Scheduling)
        cookChains.forEach(chain => {
           this.scheduleChain(chain, outputBlocks)
        })

        // 3. Find Global Cooking Start Time (The "Checkpoint")
        let globalCookStart = 0
        if (outputBlocks.length > 0) {
            globalCookStart = Math.min(...outputBlocks.map(b => b.startTime))
        }

        // Insert "Mise en place" Checkpoint
        // Ideally a virtual task, but for now we just use the time boundary.
        // We will schedule prep tasks backwards from (globalCookStart - buffer)
        
        let prepEndTimeAnchor = globalCookStart - 300 // 5 minutes buffer before cooking starts

        // 4. Schedule Prep Tasks (Reverse Scheduling from Anchor)
        // Group prep tasks by recipe to keep some sanity? Or just bulk them?
        // Bulk is better for batching.
        // Sort prep tasks: unified/merged first, then by recipe priority
        
        // Actually, since we schedule reverse, we process the LAST prep task first (closest to anchor)
        // So we want to process "small prep" first, and "heavy prep" later (which ends up earlier in time)?
        // No, in reverse scheduling:
        // Anchor <- Task A <- Task B
        // Task A is done right before Anchor.
        
        // Let's sort prep tasks so that "unified" ones are done first (early in time) -> last in reverse schedule?
        // No, unified prep should be done very early.
        // So they should be far from anchor.
        
        // Let's just process them.
        prepTasks.sort((a, b) => {
            // Put unified tasks (heavy duration) earlier in time -> later in array for reverse loop?
            // Let's just stick to default order for now.
             return 0
        })

        for (let i = prepTasks.length - 1; i >= 0; i--) {
             const { step } = prepTasks[i]
             this.scheduleSingleStep(step, prepEndTimeAnchor, outputBlocks, true) // true = update anchor
             // Update anchor for next step?
             // scheduleSingleStep finds the latest possible slot <= anchor.
             // But if we want them sequential, we should update anchor.
             // Actually, tryAllocate will find space. If we keep anchor fixed, it tries to parallelize prep.
             // Relaxed mode -> Parallelize Prep is okay, but maybe we want serial for single chef?
             // The resource timeline handles concurrency.
        }

    } else {
        // === AGGRESSIVE MODE (Original Mixed Chains) ===
        sortedChains.forEach(chain => {
            this.scheduleChain(chain, outputBlocks)
        })
    }

    if (outputBlocks.length > 0) {
      const minTime = Math.min(...outputBlocks.map(b => b.startTime))
      outputBlocks.forEach(b => {
        b.startTime -= minTime
        b.endTime -= minTime
      })
    }

    return outputBlocks.sort((a, b) => a.startTime - b.startTime)
  }

  private scheduleChain(chain: any, outputBlocks: ScheduledBlock[]) {
      // ... same logic as before, wrapped in function
      let lastStepEndTime = 0
      
      switch (chain.category) {
        case 'cold': lastStepEndTime = -1800; break; 
        case 'soup': lastStepEndTime = -600; break;  
        case 'dessert': lastStepEndTime = -1800; break; 
        default: lastStepEndTime = 0; break; 
      }

      for (let i = chain.steps.length - 1; i >= 0; i--) {
        const step = chain.steps[i]
        lastStepEndTime = this.scheduleSingleStep(step, lastStepEndTime, outputBlocks)
      }
  }

  private scheduleSingleStep(step: SchedulerStep, targetEndTime: number, outputBlocks: ScheduledBlock[], isPrepPhase: boolean = false): number {
        let proposedEnd = targetEndTime
        let placed = false
        let finalStart = targetEndTime // fallback

        while (!placed) {
          const proposedStart = proposedEnd - step.duration
          
          const requirements = this.identifyRequirements(step)
          const allocation = this.tryAllocate(step, requirements, proposedStart, proposedEnd)

          if (allocation) {
            let bufferSeconds = 60
            if (step.type === 'wait') bufferSeconds = 0
            else if (step.type === 'cook' && step.duration > 600) bufferSeconds = 120

            if (step.type === 'prep') bufferSeconds = 30
            // In Relaxed Mode Prep Phase, we might want even bigger buffers between preps? 
            // Or smaller? Let's keep 30.

            allocation.forEach(alloc => {
              const metadata = {
                type: step.type,
                equipment: step.equipment,
                instruction: step.instruction
              }
              
              this.resourceStates[alloc.type][alloc.index].book(proposedStart, proposedEnd + bufferSeconds, alloc.load, step.temp, metadata)
              
              outputBlocks.push({
                step,
                startTime: proposedStart,
                endTime: proposedEnd, 
                lane: alloc.type as any,
                resourceId: `${alloc.type}_${alloc.index + 1}`
              })
            })
            
            finalStart = proposedStart - bufferSeconds
            placed = true
          } else {
            proposedEnd -= 30 
            // Safety break
            if (proposedEnd < -172800) break; // 48 hours
          }
        }
        return finalStart
  }

  // ... (identifyRequirements, tryAllocate, check helpers 保持不变)
  private identifyRequirements(step: SchedulerStep): { type: string, load: number, temp?: number, capability?: string }[] {
    const reqs: { type: string, load: number, temp?: number, capability?: string }[] = []
    
    if (step.isActive) {
        // 智能负载推断 (Load Inference)
        // 默认为 1.0 (全神贯注)
        let load = 1.0
        
        // 1. 煮/炖/焖 (Simmering/Boiling/Stewing) -> 低负载 (0.1 - 0.2)
        // 只需要偶尔看一眼
        if (['煮', '炖', '焖', '熬', '煲', 'simmer', 'stew', 'boil'].some(k => step.instruction.toLowerCase().includes(k))) {
            load = 0.2
        }
        
        // 2. 烤/蒸 (Baking/Steaming) -> 极低负载 (0.05)
        // 主要是设备在工作
        if (['烤', '蒸', 'bake', 'roast', 'steam'].some(k => step.instruction.toLowerCase().includes(k))) {
            load = 0.05
        }
        
        // 3. 切/备菜 (Prep) -> 高负载 (0.8 - 1.0)
        // 虽然是备菜，但也需要手眼配合，很难同时炒菜，但可能同时看火
        if (step.type === 'prep') {
            load = 0.8
        }

        // 4. 爆炒 (Stir-fry) -> 满负载 (1.0)
        if (['炒', '煎', '炸', 'stir-fry', 'fry'].some(k => step.instruction.toLowerCase().includes(k))) {
            load = 1.0
        }

        reqs.push({ type: 'chef', load: load })
    }
    
    // Stove 逻辑细化
    if (this.isStoveRequired(step)) {
        const isHighHeat = ['爆炒', '大火', 'stir-fry', 'high heat'].some(k => step.instruction.toLowerCase().includes(k))
        reqs.push({ type: 'stove', load: 1.0, capability: isHighHeat ? 'high_heat' : undefined })
    }

    if (this.isOvenRequired(step)) reqs.push({ type: 'oven', load: 1.0, temp: step.temp })
    if (this.isBoardRequired(step)) reqs.push({ type: 'board', load: 0.5 })
    if (this.isBowlRequired(step)) reqs.push({ type: 'bowl', load: 1.0 })
    return reqs
  }

  private tryAllocate(step: SchedulerStep, reqs: { type: string, load: number, temp?: number, capability?: string }[], start: number, end: number): { type: string, index: number, load: number }[] | null {
    const allocation: { type: string, index: number, load: number }[] = []
    for (const req of reqs) {
      const timelines = this.resourceStates[req.type]
      if (!timelines) continue 
      
      // === 资源分配策略优化 (Load Balancing + Role Bias) ===
      if (req.type === 'chef' && timelines.length > 1) {
         // 找出所有当前空闲的厨师
         const candidates: number[] = []
         for (let i = 0; i < timelines.length; i++) {
           if (timelines[i].isAvailable(start, end, 1.0, req.load, req.temp, req.capability)) {
             candidates.push(i)
           }
         }

         if (candidates.length === 0) return null

         // 评分选择最佳厨师
         // 分数越低越好
         // 基础分 = 已工作时长 (Balance Load)
         // 惩罚分 = 角色不匹配 (Role Bias)
         
         const bestIndex = candidates.sort((a, b) => {
            const scoreA = this.calculateChefScore(a, step, timelines[a], end)
            const scoreB = this.calculateChefScore(b, step, timelines[b], end)
            return scoreA - scoreB
         })[0]

         allocation.push({ type: req.type, index: bestIndex, load: req.load })

      } else {
        // 其他资源 (Stove, Oven, etc.) 依然采用贪心算法，优先填满第一个
        let foundIndex = -1
        for (let i = 0; i < timelines.length; i++) {
            if (timelines[i].isAvailable(start, end, 1.0, req.load, req.temp, req.capability)) {
            foundIndex = i
            break
            }
        }
        if (foundIndex !== -1) {
            allocation.push({ type: req.type, index: foundIndex, load: req.load })
        } else {
            return null 
        }
      }
    }
    return allocation
  }

  private calculateChefScore(index: number, step: SchedulerStep, timeline: ResourceTimeline, proposedEnd: number): number {
      let score = timeline.totalBookedTime 

      const isMainChef = index === 0
      const isPrep = step.type === 'prep' || ['切', '洗', '腌', '拌', 'peel', 'chop', 'wash'].some(k => step.instruction.toLowerCase().includes(k))
      const isCook = step.type === 'cook' || ['炒', '煎', '炸', '煮', 'stir-fry', 'pan-fry'].some(k => step.instruction.toLowerCase().includes(k))

      // 角色偏好惩罚 (Penalty cost)
      // 假设平均一个步骤 300-600秒。惩罚值应足够大以体现偏好，但不能大到完全忽略负载均衡。
      // 设定惩罚值为 600 (相当于增加10分钟的工作负载感)

      if (isMainChef) {
          if (isPrep) score += 1200 // 主厨不喜欢做备菜 (Strong penalty)
          // if (isCook) score += 0  // 主厨喜欢做菜
      } else {
          // 帮厨
          if (isCook) score += 1200 // 帮厨不擅长核心烹饪 (Strong penalty)
          // if (isPrep) score += 0  // 帮厨喜欢备菜
      }

      // === 2025-12 New: Inertia Reward (减少上下文切换) ===
      // 查看该厨师紧接着要做什么（在时间轴上是 Future Task，在排课顺序中是 Past Task）
      // 如果当前任务和紧接着的任务类型相似，给予奖励（减少 Score）
      const nextTask = timeline.getNearestFutureTask(proposedEnd)
      if (nextTask && nextTask.metadata) {
          let inertiaBonus = 0
          
          // 1. Same Type (e.g. Prep -> Prep)
          if (nextTask.metadata.type === step.type) {
              inertiaBonus += 300 // 奖励 5 分钟
          }
          
          // 2. Same Equipment (e.g. Board -> Board)
          if (step.equipment && nextTask.metadata.equipment === step.equipment) {
              inertiaBonus += 200 // 额外奖励 3 分钟
          }

          score -= inertiaBonus
      }

      return score
  }

  private isStoveRequired(step: SchedulerStep): boolean {
    if (['wok', 'pan', 'pot', 'pressure_cooker'].includes(step.equipment || '')) return true
    if (step.type === 'cook') {
      const nonStoveEquip = ['oven', 'steamer', 'air_fryer', 'microwave', 'sous_vide']
      if (nonStoveEquip.includes(step.equipment || '')) return false
      return true
    }
    return false
  }

  private isOvenRequired(step: SchedulerStep): boolean {
    if (['oven', 'steamer', 'air_fryer'].includes(step.equipment || '')) return true
    return false
  }

  private isBoardRequired(step: SchedulerStep): boolean {
    if (step.equipment === 'board') return true
    if (['切', '剁', '拍', '削', '剔', '去皮'].some(k => step.instruction.includes(k))) return true
    return false
  }

  private isBowlRequired(step: SchedulerStep): boolean {
    if (step.equipment === 'bowl') return true
    if (['腌', '拌', '打发', '静置'].some(k => step.instruction.includes(k))) return true
    return false
  }
}

