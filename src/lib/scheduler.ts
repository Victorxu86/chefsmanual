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
  // 记录占用的区间和消耗量 (load)
  private occupied: { start: number, end: number, load: number }[] = []

  // 检查是否有足够的剩余容量
  // capacity: 总容量 (例如 board=1)
  // required: 需要的量 (例如切菜=0.5)
  isAvailable(start: number, end: number, capacity: number, required: number): boolean {
    // 检查区间内是否有任何时刻的累积负载 > capacity - required
    // 这是一个扫描线算法的问题，但在离散时间轴上简化为采样检查
    // 为了简单且高效，我们检查所有与 [start, end] 重叠的区间
    
    // 找到所有重叠的区间
    const overlaps = this.occupied.filter(interval => 
      !(interval.end <= start || interval.start >= end)
    )

    if (overlaps.length === 0) return true

    // 如果有重叠，需要精细计算最大并发负载
    // 这里简化处理：如果任何重叠区间的当前负载 + required > capacity，则不可用
    // 这假设重叠区间本身是互斥的或者叠加的？
    // 我们的 occupied 列表是扁平的。如果有两个任务重叠，我们会分别记录。
    // 所以我们需要把时间点打散，计算峰值。
    
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
      
      // 计算 [p1, p2] 这一段的负载
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
    // 每个具体资源实例都有一个 Timeline
    // 对于 Board，如果用户有 1 个砧板，我们只有一个 Timeline，但它的容量判定逻辑会有点不同？
    // 不，我们的 ResourceTimeline 是针对 "单个资源实例" 的。
    // 如果 board=1, load=0.5，意味着这个实例可以承载两个 0.5。
    // 所以我们的 ResourceTimeline 类已经支持了 load。
    
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

    const allTaskChains = recipes.map((recipe, idx) => {
      const color = `hsl(${idx * 60}, 70%, 50%)` 
      return recipe.steps.map((s: any) => {
        // === 智能推断 Active/Passive ===
        let isActive = s.is_active
        // 尝试从 instruction 匹配 Action Label
        // 注意：instruction 可能是 "切 洋葱"，我们要匹配 "切"
        const actionEntry = Object.values(ACTIONS).find((a: any) => s.instruction.startsWith(a.label))
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
    })

    const sortedChains = allTaskChains.sort((chainA, chainB) => {
      const durationA = chainA.reduce((sum: number, s: any) => sum + s.duration, 0)
      const durationB = chainB.reduce((sum: number, s: any) => sum + s.duration, 0)
      return durationB - durationA
    })

    for (const chain of sortedChains) {
      let lastStepEndTime = 0 

      for (let i = chain.length - 1; i >= 0; i--) {
        const step = chain[i]
        let proposedEnd = lastStepEndTime
        let placed = false

        while (!placed) {
          const proposedStart = proposedEnd - step.duration
          
          const requirements = this.identifyRequirements(step)
          const allocation = this.tryAllocate(requirements, proposedStart, proposedEnd)

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

  private identifyRequirements(step: SchedulerStep): { type: string, load: number }[] {
    const reqs: { type: string, load: number }[] = []
    
    // Chef (Active 占 1.0)
    if (step.isActive) reqs.push({ type: 'chef', load: 1.0 })
    
    // Stove
    if (this.isStoveRequired(step)) reqs.push({ type: 'stove', load: 1.0 })
    
    // Oven
    if (this.isOvenRequired(step)) reqs.push({ type: 'oven', load: 1.0 })
    
    // Board (切菜占 0.5)
    if (this.isBoardRequired(step)) reqs.push({ type: 'board', load: 0.5 })
    
    // Bowl
    if (this.isBowlRequired(step)) reqs.push({ type: 'bowl', load: 1.0 })

    return reqs
  }

  private tryAllocate(reqs: { type: string, load: number }[], start: number, end: number): { type: string, index: number, load: number }[] | null {
    const allocation: { type: string, index: number, load: number }[] = []

    for (const req of reqs) {
      const timelines = this.resourceStates[req.type]
      if (!timelines) continue 

      let foundIndex = -1
      // 遍历所有实例 (例如 board_1, board_2)
      for (let i = 0; i < timelines.length; i++) {
        // 对每个实例，检查是否还有剩余负载 (Capacity 默认是 1.0)
        // 如果 req.load 是 0.5，只要当前负载 <= 0.5 就可以放入
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

    return allocation
  }

  // === 辅助判断逻辑 ===
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
