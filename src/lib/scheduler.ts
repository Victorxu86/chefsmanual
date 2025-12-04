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
  equipment?: string // 占用特定设备
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

// 资源池定义
interface ResourcePool {
  chef: number 
  stove: number 
  oven: number
  board: number // 砧板
  bowl: number  // 料理碗
}

// 资源时间轴 (记录占用情况)
class ResourceTimeline {
  private occupied: { start: number, end: number, load: number }[] = []
  public totalBookedTime: number = 0

  isAvailable(start: number, end: number, capacity: number, required: number): boolean {
    const overlaps = this.occupied.filter(interval => 
      !(interval.end <= start || interval.start >= end)
    )

    if (overlaps.length === 0) return true

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
      
      if (currentLoad + required > capacity) return false
    }

    return true
  }

  book(start: number, end: number, load: number) {
    this.occupied.push({ start, end, load })
    this.totalBookedTime += (end - start) * load
  }
}

export class KitchenScheduler {
  private resources: ResourcePool
  private resourceStates: Record<string, ResourceTimeline[]> = {}

  constructor(resources: Partial<ResourcePool> = {}) {
    this.resources = {
      chef: 1,
      stove: 2,
      oven: 1,
      board: 1,
      bowl: 2,
      ...resources
    }
  }

  private initResourceStates() {
    this.resourceStates = {
      chef: Array(this.resources.chef).fill(null).map(() => new ResourceTimeline()),
      stove: Array(this.resources.stove).fill(null).map(() => new ResourceTimeline()),
      oven: Array(this.resources.oven).fill(null).map(() => new ResourceTimeline()),
      board: Array(this.resources.board).fill(null).map(() => new ResourceTimeline()),
      bowl: Array(this.resources.bowl).fill(null).map(() => new ResourceTimeline()),
    }
  }

  schedule(recipes: any[]): ScheduledBlock[] {
    this.initResourceStates()
    const outputBlocks: ScheduledBlock[] = []

    // 1. 预处理
    const allTaskChains = recipes.map((recipe, idx) => {
      const color = `hsl(${idx * 60}, 70%, 85%)` 
      const category = recipe.category || 'main'
      
      return {
        recipeId: recipe.id,
        category,
        steps: recipe.steps.map((s: any) => {
          let isActive = s.is_active
          // 优化：使用 includes 而不是 startsWith，以便识别 "转小火炖" 中的 "炖"
          const actionEntry = Object.values(ACTIONS).find((a: any) => {
            // 1. 优先匹配 label 相同的
            if (s.instruction.includes(a.label)) return true
            // 2. 也可以匹配 id (英文key)
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
            isInterruptible: s.is_interruptible,
            _actionKey: (actionEntry as any)?.id
          } as SchedulerStep
        }).sort((a: any, b: any) => a.stepOrder - b.stepOrder)
      }
    })

    // 排序策略：先排对齐时间要求最严格的 (main)，再排灵活的 (cold, soup)
    // 优先级: Main > Staple > Soup > Cold > Dessert
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
      if (pA !== pB) return pB - pA // 优先级高的先排
      
      // 同优先级，按总时长降序
      const durationA = a.steps.reduce((sum: number, s: any) => sum + s.duration, 0)
      const durationB = b.steps.reduce((sum: number, s: any) => sum + s.duration, 0)
      return durationB - durationA
    })

    for (const chain of sortedChains) {
      // === 智能设定目标结束时间 ===
      let lastStepEndTime = 0
      
      switch (chain.category) {
        case 'cold': lastStepEndTime = -1800; break; // 提前30分钟做完
        case 'soup': lastStepEndTime = -600; break;  // 提前10分钟做完
        case 'dessert': lastStepEndTime = -1800; break; // 改为饭前30分钟做完
        default: lastStepEndTime = 0; break; // 准点
      }

      for (let i = chain.steps.length - 1; i >= 0; i--) {
        const step = chain.steps[i]
        let proposedEnd = lastStepEndTime
        let placed = false

        while (!placed) {
          const proposedStart = proposedEnd - step.duration
          
          const requirements = this.identifyRequirements(step)
          const allocation = this.tryAllocate(step, requirements, proposedStart, proposedEnd)

          if (allocation) {
            allocation.forEach(alloc => {
              this.resourceStates[alloc.type][alloc.index].book(proposedStart, proposedEnd, alloc.load)
              
              outputBlocks.push({
                step,
                startTime: proposedStart,
                endTime: proposedEnd,
                lane: alloc.type as any,
                resourceId: `${alloc.type}_${alloc.index + 1}`
              })
            })
            
            lastStepEndTime = proposedStart 
            placed = true
          } else {
            proposedEnd -= 30 
            if (proposedEnd < -86400) break; 
          }
        }
      }
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

  // ... (identifyRequirements, tryAllocate, check helpers 保持不变)
  private identifyRequirements(step: SchedulerStep): { type: string, load: number }[] {
    const reqs: { type: string, load: number }[] = []
    if (step.isActive) reqs.push({ type: 'chef', load: 1.0 })
    if (this.isStoveRequired(step)) reqs.push({ type: 'stove', load: 1.0 })
    if (this.isOvenRequired(step)) reqs.push({ type: 'oven', load: 1.0 })
    if (this.isBoardRequired(step)) reqs.push({ type: 'board', load: 0.5 })
    if (this.isBowlRequired(step)) reqs.push({ type: 'bowl', load: 1.0 })
    return reqs
  }

  private tryAllocate(step: SchedulerStep, reqs: { type: string, load: number }[], start: number, end: number): { type: string, index: number, load: number }[] | null {
    const allocation: { type: string, index: number, load: number }[] = []
    for (const req of reqs) {
      const timelines = this.resourceStates[req.type]
      if (!timelines) continue 
      
      // === 资源分配策略优化 (Load Balancing + Role Bias) ===
      if (req.type === 'chef' && timelines.length > 1) {
         // 找出所有当前空闲的厨师
         const candidates: number[] = []
         for (let i = 0; i < timelines.length; i++) {
           if (timelines[i].isAvailable(start, end, 1.0, req.load)) {
             candidates.push(i)
           }
         }

         if (candidates.length === 0) return null

         // 评分选择最佳厨师
         // 分数越低越好
         // 基础分 = 已工作时长 (Balance Load)
         // 惩罚分 = 角色不匹配 (Role Bias)
         
         const bestIndex = candidates.sort((a, b) => {
            const scoreA = this.calculateChefScore(a, step, timelines[a])
            const scoreB = this.calculateChefScore(b, step, timelines[b])
            return scoreA - scoreB
         })[0]

         allocation.push({ type: req.type, index: bestIndex, load: req.load })

      } else {
        // 其他资源 (Stove, Oven, etc.) 依然采用贪心算法，优先填满第一个
        let foundIndex = -1
        for (let i = 0; i < timelines.length; i++) {
            if (timelines[i].isAvailable(start, end, 1.0, req.load)) {
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

  private calculateChefScore(index: number, step: SchedulerStep, timeline: ResourceTimeline): number {
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
