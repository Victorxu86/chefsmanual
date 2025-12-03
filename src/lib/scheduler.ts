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
  lane: "chef" | "stove" | "oven" | "other" // 泳道归属
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

export class KitchenScheduler {
  private steps: SchedulerStep[] = []
  private timeline: ScheduledBlock[] = []
  private resources: ResourcePool

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

  schedule(recipes: any[]): ScheduledBlock[] {
    const allTaskChains = recipes.map((recipe, idx) => {
      const color = `hsl(${idx * 60}, 70%, 50%)` 
      return recipe.steps.map((s: any) => {
        // === 智能推断 Active/Passive ===
        // 1. 优先使用 constants.ts 里的 forcePassive 定义
        let isActive = s.is_active
        // 尝试从 instruction 反推 action key (简单匹配 label)
        // 注意：这里只是简单的包含匹配，理想情况是保存时就存了 actionKey
        // 如果前端 V5 保存了 _actionKey，这里可以直接用
        // 但数据库 schema 可能丢了它。
        // 我们尝试遍历 ACTIONS 找匹配
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

    this.timeline = []
    
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
          
          if (this.checkAvailability(step, proposedStart, proposedEnd)) {
            const laneInfo = this.assignLane(step)
            this.timeline.push({
              step,
              startTime: proposedStart,
              endTime: proposedEnd,
              lane: laneInfo.lane,
              resourceId: laneInfo.id
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

    if (this.timeline.length > 0) {
      const minTime = Math.min(...this.timeline.map(b => b.startTime))
      this.timeline.forEach(b => {
        b.startTime -= minTime
        b.endTime -= minTime
      })
    }

    return this.timeline.sort((a, b) => a.startTime - b.startTime)
  }

  private checkAvailability(step: SchedulerStep, start: number, end: number): boolean {
    // 1. 检查 Chef (Active)
    if (step.isActive) {
      const chefConflict = this.timeline.some(b => 
        b.step.isActive && 
        !(b.endTime <= start || b.startTime >= end)
      )
      if (chefConflict) return false
    }

    // 2. 检查 Stove
    if (this.isStoveRequired(step)) {
      if (this.countUsage(start, end, this.isStoveRequired.bind(this)) >= this.resources.stove) return false
    }

    // 3. 检查 Oven
    if (this.isOvenRequired(step)) {
      if (this.countUsage(start, end, this.isOvenRequired.bind(this)) >= this.resources.oven) return false
    }

    // 4. 检查 Board (权重 0.5)
    if (this.isBoardRequired(step)) {
      // 统计当前时间段内占用砧板的任务数量
      // 以前是 count，现在我们要累加权重
      // 假设所有切菜任务权重都是 0.5
      const boardUsage = this.timeline
        .filter(b => this.isBoardRequired(b.step) && !(b.endTime <= start || b.startTime >= end))
        .reduce((acc, b) => acc + 0.5, 0)
      
      // 当前任务也要占 0.5
      if (boardUsage + 0.5 > this.resources.board) return false
    }

    // 5. 检查 Bowl
    if (this.isBowlRequired(step)) {
      if (this.countUsage(start, end, this.isBowlRequired.bind(this)) >= this.resources.bowl) return false
    }

    return true
  }

  private countUsage(start: number, end: number, predicate: (s: SchedulerStep) => boolean): number {
    return this.timeline.filter(b => 
      predicate(b.step) &&
      !(b.endTime <= start || b.startTime >= end)
    ).length
  }

  private isStoveRequired(step: SchedulerStep): boolean {
    if (['wok', 'pan', 'pot', 'pressure_cooker'].includes(step.equipment || '')) return true
    // 如果动作包含炒、煎、煮、炖、焖，且不是电饭煲/烤箱
    if (['炒', '煎', '煮', '炖', '焖', '煨', '焯水'].some(k => step.instruction.includes(k))) {
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

  private assignLane(step: SchedulerStep): { lane: ScheduledBlock['lane'], id: string } {
    if (this.isOvenRequired(step)) return { lane: 'oven', id: 'oven_1' }
    if (this.isStoveRequired(step)) return { lane: 'stove', id: 'stove_any' }
    return { lane: 'chef', id: 'chef_1' }
  }
}
