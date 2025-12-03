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
}

export interface ScheduledBlock {
  step: SchedulerStep
  startTime: number // 相对开饭时间的秒数
  endTime: number
  lane: "chef" | "stove" | "oven" | "board" | "bowl" | "other"
  resourceId: string // 具体资源ID (如 stove_1, stove_2)
}

// 资源池定义
interface ResourcePool {
  chef: number 
  stove: number 
  oven: number
  board: number
  bowl: number
}

// 资源时间轴 (记录占用情况)
class ResourceTimeline {
  private occupied: { start: number, end: number }[] = []

  isAvailable(start: number, end: number): boolean {
    return !this.occupied.some(interval => 
      !(interval.end <= start || interval.start >= end)
    )
  }

  book(start: number, end: number) {
    this.occupied.push({ start, end })
    // 保持有序并非必须，但利于调试
    this.occupied.sort((a, b) => a.start - b.start)
  }
}

export class KitchenScheduler {
  private resources: ResourcePool
  // 资源实例状态: resourceType -> resourceIndex -> Timeline
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
    
    // 初始化资源时间轴
    this.initResourceStates()
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
    this.initResourceStates() // 重置状态
    const outputBlocks: ScheduledBlock[] = []

    // 1. 预处理步骤
    const allTaskChains = recipes.map((recipe, idx) => {
      const color = `hsl(${idx * 60}, 70%, 50%)` 
      return recipe.steps.map((s: any) => {
        let isActive = s.is_active
        const actionEntry = Object.values(ACTIONS).find((a: any) => s.instruction.startsWith(a.label))
        if (actionEntry && actionEntry.forcePassive !== undefined) {
          isActive = !actionEntry.forcePassive
        }
        // 特殊规则：切菜只占 0.5？不，V3算法使用资源槽位，我们假设切菜占 1 个板 + 1 个手
        // 为了简化，我们不搞 0.5，而是依赖具体的资源实例

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
        } as SchedulerStep
      }).sort((a: any, b: any) => a.stepOrder - b.stepOrder)
    })

    // 按总时长降序
    const sortedChains = allTaskChains.sort((chainA, chainB) => {
      const durationA = chainA.reduce((sum: number, s: any) => sum + s.duration, 0)
      const durationB = chainB.reduce((sum: number, s: any) => sum + s.duration, 0)
      return durationB - durationA
    })

    // 2. 倒序排程
    for (const chain of sortedChains) {
      let lastStepEndTime = 0 

      for (let i = chain.length - 1; i >= 0; i--) {
        const step = chain[i]
        let proposedEnd = lastStepEndTime
        let placed = false

        // 搜索循环
        while (!placed) {
          const proposedStart = proposedEnd - step.duration
          
          // 检查所有需要的资源是否都有空闲的实例
          const requirements = this.identifyRequirements(step)
          const allocation = this.tryAllocate(requirements, proposedStart, proposedEnd)

          if (allocation) {
            // 预订资源并生成 Blocks
            allocation.forEach(alloc => {
              this.resourceStates[alloc.type][alloc.index].book(proposedStart, proposedEnd)
              
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

    // 3. 归一化
    if (outputBlocks.length > 0) {
      const minTime = Math.min(...outputBlocks.map(b => b.startTime))
      outputBlocks.forEach(b => {
        b.startTime -= minTime
        b.endTime -= minTime
      })
    }

    return outputBlocks.sort((a, b) => a.startTime - b.startTime)
  }

  // 识别步骤需要哪些资源
  private identifyRequirements(step: SchedulerStep): string[] {
    const reqs: string[] = []
    
    // Chef
    if (step.isActive) reqs.push('chef')
    
    // Stove
    if (this.isStoveRequired(step)) reqs.push('stove')
    
    // Oven
    if (this.isOvenRequired(step)) reqs.push('oven')
    
    // Board
    if (this.isBoardRequired(step)) reqs.push('board')
    
    // Bowl
    if (this.isBowlRequired(step)) reqs.push('bowl')

    return reqs
  }

  // 尝试分配资源实例
  private tryAllocate(reqs: string[], start: number, end: number): { type: string, index: number }[] | null {
    const allocation: { type: string, index: number }[] = []

    for (const type of reqs) {
      // 找到该类型下第一个空闲的实例
      const timelines = this.resourceStates[type]
      if (!timelines) continue // Unknown resource type

      let foundIndex = -1
      for (let i = 0; i < timelines.length; i++) {
        if (timelines[i].isAvailable(start, end)) {
          foundIndex = i
          break
        }
      }

      if (foundIndex !== -1) {
        allocation.push({ type, index: foundIndex })
      } else {
        return null // 资源不足，分配失败
      }
    }

    return allocation
  }

  // === 辅助判断逻辑 (同前) ===
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
