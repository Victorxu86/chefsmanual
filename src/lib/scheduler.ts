import { ACTIONS, ActionKey } from "./constants"

export interface SchedulerStep {
  id: string
  recipeId: string
  recipeColor: string 
  stepOrder: number
  instruction: string
  duration: number 
  type: "prep" | "cook" | "wait" | "serve"
  isActive: boolean 
  equipment?: string 
  isInterruptible: boolean 
  _actionKey?: string
}

export interface ScheduledBlock {
  step: SchedulerStep
  startTime: number 
  endTime: number
  lane: "chef" | "stove" | "oven" | "board" | "bowl" | "other"
  resourceId: string 
}

interface ResourcePool {
  chef: number 
  stove: number 
  oven: number
  board: number
  bowl: number
}

class ResourceTimeline {
  // 增加 recipeId 用于连续性判断
  private occupied: { start: number, end: number, load: number, recipeId?: string }[] = []

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

  book(start: number, end: number, load: number, recipeId?: string) {
    this.occupied.push({ start, end, load, recipeId })
  }

  // 检查紧接着是否有同一道菜的任务 (用于倒序排程时的连续性判定)
  hasTaskAfter(time: number, recipeId: string): boolean {
    // 检查范围：紧接着的 5 分钟内
    return this.occupied.some(o => o.start >= time && o.start <= time + 300 && o.recipeId === recipeId)
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

    const allTaskChains = recipes.map((recipe, idx) => {
      const color = `hsl(${idx * 60}, 70%, 50%)` 
      return recipe.steps.map((s: any) => {
        let isActive = s.is_active
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
      // 简单处理：没有 category 信息时默认为 0
      let lastStepEndTime = 0 
      // (注意：这里的 schedule 函数参数里没有 category，如果需要 category 调度，需要前端传入带 category 的对象)
      // 假设前端传入的 recipes 已经包含了 category 属性 (V4 逻辑)
      // 为了兼容性，这里先简化，如果需要 category 逻辑，请确保 recipes 数组里的对象有 category

      for (let i = chain.length - 1; i >= 0; i--) {
        const step = chain[i]
        let proposedEnd = lastStepEndTime
        let placed = false

        while (!placed) {
          const proposedStart = proposedEnd - step.duration
          
          const requirements = this.identifyRequirements(step)
          // 使用 Best Fit 算法
          const allocation = this.tryAllocateBestFit(requirements, proposedStart, proposedEnd, step)

          if (allocation) {
            allocation.forEach(alloc => {
              // Book 时记录 recipeId
              this.resourceStates[alloc.type][alloc.index].book(proposedStart, proposedEnd, alloc.load, step.recipeId)
              
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
    if (step.isActive) reqs.push({ type: 'chef', load: 1.0 })
    if (this.isStoveRequired(step)) reqs.push({ type: 'stove', load: 1.0 })
    if (this.isOvenRequired(step)) reqs.push({ type: 'oven', load: 1.0 })
    if (this.isBoardRequired(step)) reqs.push({ type: 'board', load: 0.5 })
    if (this.isBowlRequired(step)) reqs.push({ type: 'bowl', load: 1.0 })
    return reqs
  }

  // === 核心升级：最佳适应分配算法 ===
  private tryAllocateBestFit(reqs: { type: string, load: number }[], start: number, end: number, step: SchedulerStep): { type: string, index: number, load: number }[] | null {
    const allocation: { type: string, index: number, load: number }[] = []

    for (const req of reqs) {
      const timelines = this.resourceStates[req.type]
      if (!timelines) continue 

      // 寻找所有可用的候选资源，并打分
      const candidates: { index: number, score: number }[] = []

      for (let i = 0; i < timelines.length; i++) {
        if (timelines[i].isAvailable(start, end, 1.0, req.load)) {
          let score = 100 // 基础分
          
          // 1. 角色偏好 (Role Preference)
          // 假设 Chef #1 是 Head Chef (擅长 Cook), Chef #2 是 Sous Chef (擅长 Prep)
          // 仅当有多人时才启用此策略
          if (req.type === 'chef' && this.resources.chef > 1) {
             if (i === 0) { // Head Chef
                if (step.type === 'cook') score += 50
                if (step.type === 'serve') score += 30
                if (step.type === 'prep') score -= 20
             } else if (i === 1) { // Sous Chef
                if (step.type === 'prep') score += 50
                if (step.type === 'wait' || step.type === 'serve') score += 20
                if (step.type === 'cook') score -= 20
             }
          }

          // 2. 连续性粘滞 (Continuity Stickiness)
          // 检查该资源紧接着（未来）是否有同一个 Recipe 的任务
          // 因为我们是倒序排，所以 "未来" 的任务其实是已经排好的、时间轴上靠后的任务
          if (timelines[i].hasTaskAfter(end, step.recipeId)) {
            score += 80 // 极高的权重：尽量让同一个人做同一道菜的连续步骤
          }

          candidates.push({ index: i, score })
        }
      }

      // 按分数降序排列，选第一个
      candidates.sort((a, b) => b.score - a.score)

      if (candidates.length > 0) {
        allocation.push({ type: req.type, index: candidates[0].index, load: req.load })
      } else {
        return null // 资源不足
      }
    }

    return allocation
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
