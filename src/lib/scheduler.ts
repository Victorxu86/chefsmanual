import { ActionKey } from "./constants"

// === 核心数据结构 ===

export interface SchedulerStep {
  id: string
  recipeId: string
  recipeColor: string // 用于UI区分不同菜
  stepOrder: number
  instruction: string
  duration: number // 秒
  type: "prep" | "cook" | "wait" | "serve"
  isActive: boolean // 是否占用人手
  equipment?: string // 占用特定设备
  isInterruptible: boolean // 能否打断 (暂未用到，保留给V2)
}

export interface ScheduledBlock {
  step: SchedulerStep
  startTime: number // 相对开饭时间的秒数 (通常为负数)
  endTime: number
  lane: "chef" | "stove" | "oven" | "other" // 泳道归属
  resourceId: string // 具体资源ID (如 stove_1, stove_2)
}

// 资源池定义
interface ResourcePool {
  chef: number // 并发数，通常为 1
  stove: number // 炉头数，通常为 2
  oven: number
  // ... 其他设备默认无限
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
      ...resources
    }
  }

  /**
   * 核心入口：输入多个菜谱的步骤，输出调度结果
   * @param recipes 菜谱列表，每个菜谱包含 steps
   */
  schedule(recipes: any[]): ScheduledBlock[] {
    // 1. 预处理：把所有菜谱的步骤打平，并附带元数据
    const allTaskChains = recipes.map((recipe, idx) => {
      const color = `hsl(${idx * 60}, 70%, 50%)` // 简单的颜色生成
      return recipe.steps.map((s: any) => ({
        id: s.id || Math.random().toString(),
        recipeId: recipe.id,
        recipeColor: color,
        stepOrder: s.step_order,
        instruction: s.instruction,
        duration: s.duration_seconds,
        type: s.step_type,
        isActive: s.is_active,
        equipment: s.equipment,
        isInterruptible: s.is_interruptible
      } as SchedulerStep)).sort((a: any, b: any) => a.stepOrder - b.stepOrder)
    })

    // 2. 倒序排程 (Backward Scheduling)
    // 目标：所有菜的最后一步同时结束于 T=0
    this.timeline = []
    
    // 我们维护一个 "资源占用表"，记录每个时刻每个资源的占用情况
    // 由于是倒序，我们从 T=0 开始向负无穷探索
    // 为了简化，我们用一个 Block 列表来做碰撞检测
    
    // 策略：
    // 对每个菜谱 (Chain)，从最后一个 Task 开始排。
    // 尝试把它放在 T=0 (结束时间)。
    // 检查资源冲突。如果冲突，就向左移 (更早的时间)。
    // 确定位置后，该菜谱的上一个 Task 的结束时间 = 当前 Task 的开始时间。
    
    // 优化点：这里应该是 "贪心" 的。
    // 简单的贪心：按总时长排序，先排耗时最长的菜 (长作业优先)。
    
    // 按总时长降序排序
    const sortedChains = allTaskChains.sort((chainA, chainB) => {
      const durationA = chainA.reduce((sum: number, s: any) => sum + s.duration, 0)
      const durationB = chainB.reduce((sum: number, s: any) => sum + s.duration, 0)
      return durationB - durationA
    })

    for (const chain of sortedChains) {
      let lastStepEndTime = 0 // 锚点：开饭时间

      // 倒序遍历步骤 (从 Serve -> Cook -> Prep)
      for (let i = chain.length - 1; i >= 0; i--) {
        const step = chain[i]
        
        // 寻找可行的插入时间段 [start, end]
        // 满足: end <= lastStepEndTime
        // 满足: duration = step.duration
        // 满足: 资源不冲突
        
        let proposedEnd = lastStepEndTime
        let placed = false

        // 搜索循环 (向左滑动)
        while (!placed) {
          const proposedStart = proposedEnd - step.duration
          
          if (this.checkAvailability(step, proposedStart, proposedEnd)) {
            // 找到了！
            const laneInfo = this.assignLane(step)
            this.timeline.push({
              step,
              startTime: proposedStart,
              endTime: proposedEnd,
              lane: laneInfo.lane,
              resourceId: laneInfo.id
            })
            
            lastStepEndTime = proposedStart // 更新锚点
            placed = true
          } else {
            // 冲突了，尝试向左移一点点 (步长 30秒)
            proposedEnd -= 30 
            // 保护：防止无限循环
            if (proposedEnd < -86400) break; 
          }
        }
      }
    }

    // 3. 坐标归一化 (Normalize)
    // 现在的 T 是负数。我们需要找到最小的 StartTime，把它设为 0。
    if (this.timeline.length > 0) {
      const minTime = Math.min(...this.timeline.map(b => b.startTime))
      this.timeline.forEach(b => {
        b.startTime -= minTime
        b.endTime -= minTime
      })
      // 现在的 endTime 就是开饭时间
    }

    return this.timeline.sort((a, b) => a.startTime - b.startTime)
  }

  // 检查某段时间内资源是否可用
  private checkAvailability(step: SchedulerStep, start: number, end: number): boolean {
    // 1. 检查 Chef (如果 Active)
    if (step.isActive) {
      const chefConflict = this.timeline.some(b => 
        b.step.isActive && // 对方也是 Active
        !(b.endTime <= start || b.startTime >= end) // 时间重叠
      )
      if (chefConflict) return false
    }

    // 2. 检查 Stove (如果需要)
    // 简化的逻辑：如果是 'cook' 类型且 active=false (炖煮)，或者是 active=true 且 equipment='wok'/'pot'
    // 我们假设所有 'cook' 类型的步骤都需要占用一个灶眼，除非它是 oven/steamer
    if (this.isStoveRequired(step)) {
      const stoveUsage = this.timeline.filter(b => 
        this.isStoveRequired(b.step) &&
        !(b.endTime <= start || b.startTime >= end)
      ).length
      
      if (stoveUsage >= this.resources.stove) return false
    }

    return true
  }

  private isStoveRequired(step: SchedulerStep): boolean {
    // 简单的判断逻辑：Cook 类且不是烤箱
    if (step.type !== 'cook') return false
    if (step.equipment === 'oven' || step.equipment === 'steamer' || step.equipment === 'air_fryer') return false
    return true
  }

  private assignLane(step: SchedulerStep): { lane: ScheduledBlock['lane'], id: string } {
    if (step.equipment === 'oven') return { lane: 'oven', id: 'oven_1' }
    if (this.isStoveRequired(step)) return { lane: 'stove', id: 'stove_any' } // UI 层再去分 stove_1/2
    return { lane: 'chef', id: 'chef_1' }
  }
}

