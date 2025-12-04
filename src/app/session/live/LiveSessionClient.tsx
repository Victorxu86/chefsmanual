"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ScheduledBlock } from "@/lib/scheduler"
import { ArrowLeft, Play, Pause, CheckCircle, AlertCircle, Clock, Flame, User, ChefHat, ChevronLeft, ChevronRight } from "lucide-react"

// === State Models ===

interface LiveTask extends ScheduledBlock {
  status: 'pending' | 'active' | 'completed' | 'blocked'
  runtimeId: string
  actualStartTime?: number
  actualEndTime?: number
  forceActive?: boolean
}

interface ChefState {
  id: string 
  name: string
  currentTaskId?: string
  nextTaskId?: string
}

interface LiveSessionState {
  tasks: LiveTask[]
  chefs: ChefState[]
  startTime?: number
  elapsedSeconds: number
  isPaused: boolean
}

export function LiveSessionClient() {
  const router = useRouter()
  const [sessionData, setSessionData] = useState<any>(null)
  const [liveState, setLiveState] = useState<LiveSessionState>({
    tasks: [],
    chefs: [],
    elapsedSeconds: 0,
    isPaused: true
  })
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Helper: Check if task dependencies are met (same recipe, previous steps)
  const isDependencyMet = (task: LiveTask, allTasks: LiveTask[]) => {
    // Find all tasks from the same recipe with a lower stepOrder
    const dependencies = allTasks.filter(t => 
        t.step.recipeId === task.step.recipeId && 
        t.step.stepOrder < task.step.stepOrder
    )
    // All of them must be completed
    return dependencies.every(d => d.status === 'completed')
  }

  // Helper: Update Chef Assignments based on current tasks
  // Returns updated chef list
  const updateChefAssignments = (tasks: LiveTask[], currentChefs: ChefState[], elapsedSeconds: number) => {
    return currentChefs.map(chef => {
        const activeTask = tasks.find(t => t.status === 'active' && t.resourceId === chef.id)
        const nextTask = tasks
            .filter(t => t.status === 'pending' && t.resourceId === chef.id)
            .sort((a, b) => a.startTime - b.startTime)[0]
        
        return {
            ...chef,
            currentTaskId: activeTask?.runtimeId,
            nextTaskId: nextTask?.runtimeId
        }
    })
  }

  // 1. Initialize from LocalStorage
  useEffect(() => {
    const raw = localStorage.getItem('cooking_session')
    if (!raw) {
      router.push('/session')
      return
    }
    
    try {
      const data = JSON.parse(raw)
      setSessionData(data)
      
      const initialTasks = data.timeline.map((block: any, index: number) => ({
        ...block,
        runtimeId: `task_${index}`,
        status: 'pending'
      }))

      const initialChefs = Array.from({ length: data.resources.chef }).map((_, i) => ({
        id: `chef_${i+1}`,
        name: i === 0 ? "主厨 (我)" : `帮厨 #${i}`
      }))

      setLiveState(prev => ({
        ...prev,
        tasks: initialTasks,
        chefs: initialChefs
      }))
    } catch (e) {
      console.error("Failed to load session", e)
      router.push('/session')
    }
  }, [])

  // 2. Timer Engine
  useEffect(() => {
    if (!liveState.isPaused) {
      timerRef.current = setInterval(() => {
        setLiveState(prev => ({
          ...prev,
          elapsedSeconds: prev.elapsedSeconds + 1
        }))
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [liveState.isPaused])

  // 3. Task Resolver (The Brain)
  useEffect(() => {
    if (!sessionData || liveState.tasks.length === 0) return

    setLiveState(prev => {
      const nextTasks = [...prev.tasks]
      let hasChanges = false

      // A. Identify Active Tasks
      nextTasks.forEach(task => {
        if (task.status === 'pending') {
            if (isDependencyMet(task, nextTasks)) {
                if (prev.elapsedSeconds >= task.startTime || task.forceActive) {
                    task.status = 'active'
                    task.actualStartTime = prev.elapsedSeconds // Start now
                    hasChanges = true
                }
            }
        }
      })

      // B. Update Chef Assignments
      // Important: Only trigger updates if tasks actually changed or time progressed significantly 
      // (Actually, we need to run this on every tick if we want to auto-activate tasks based on time)
      // But here we just call it.
      const nextChefs = updateChefAssignments(nextTasks, prev.chefs, prev.elapsedSeconds)
      
      // Force update if tasks changed status
      const tasksChanged = JSON.stringify(nextTasks.map(t => t.status)) !== JSON.stringify(prev.tasks.map(t => t.status))
      
      // Check if chefs changed
      const chefsChanged = JSON.stringify(nextChefs) !== JSON.stringify(prev.chefs)

      if (!hasChanges && !chefsChanged && !tasksChanged) return prev
      return { ...prev, tasks: nextTasks, chefs: nextChefs }
    })
  }, [liveState.elapsedSeconds, sessionData])

  const togglePlayPause = () => {
    setLiveState(prev => ({ ...prev, isPaused: !prev.isPaused }))
  }

  const handleCompleteTask = (runtimeId: string) => {
    setLiveState(prev => {
      const completedTaskIndex = prev.tasks.findIndex(t => t.runtimeId === runtimeId)
      if (completedTaskIndex === -1) return prev

      const completedTask = prev.tasks[completedTaskIndex]
      const nextTasks = [...prev.tasks]
      
      // 1. Mark current as completed
      nextTasks[completedTaskIndex] = {
        ...completedTask,
        status: 'completed',
        actualEndTime: prev.elapsedSeconds
      }

      // 2. Cross-Task Trigger (Strict Dependency & Schedule Check)
      // Force activate logic:
      
      const activeChefIds = new Set(
          nextTasks.filter(t => t.status === 'active').map(t => t.resourceId)
      )

      // Iterate through all pending tasks sorted by startTime to respect the schedule order
      const sortedPendingTasks = nextTasks
        .map((t, index) => ({ ...t, originalIndex: index }))
        .filter(t => t.status === 'pending')
        .sort((a, b) => a.startTime - b.startTime)

      sortedPendingTasks.forEach((task) => {
          if (!activeChefIds.has(task.resourceId)) {
             // Check if this is the very first pending task for this chef
             // We must ensure we don't jump the queue of our own tasks
             const isFirstForChef = sortedPendingTasks.find(t => t.resourceId === task.resourceId)?.runtimeId === task.runtimeId

             // Logic Update: 
             // If it is the first task for this chef AND dependencies are met, we ALWAYS allow activation.
             // Why? Because if the user clicked "Complete", they are signaling readiness.
             // The concept of "time" in a schedule is a *minimum start time* relative to the meal end.
             // But if we are ahead of schedule, we should absolutely be allowed to proceed.
             // The only hard constraint is DEPENDENCY (e.g. wait for meat to be cut).
             
             if (isFirstForChef && isDependencyMet(task, nextTasks)) {
                 // Force Activate!
                 nextTasks[task.originalIndex] = {
                     ...task,
                     forceActive: true,
                     status: 'active', // Explicitly set active here to be safe
                     actualStartTime: prev.elapsedSeconds // Start NOW
                 }
                 // Mark chef as busy so we don't activate 2 tasks for same person
                 activeChefIds.add(task.resourceId)
             }
          }
      })
      
      // 3. Update assignments IMMEDIATELY to avoid lag
      const nextChefs = updateChefAssignments(nextTasks, prev.chefs, prev.elapsedSeconds)

      return { ...prev, tasks: nextTasks, chefs: nextChefs }
    })
  }

  const handleUndo = (chefId: string) => {
    setLiveState(prev => {
        // Find the most recently completed task for this chef
        const chefTasks = prev.tasks.filter(t => t.resourceId === chefId)
        const lastCompleted = chefTasks
            .filter(t => t.status === 'completed')
            .sort((a, b) => (b.actualEndTime || 0) - (a.actualEndTime || 0))[0] // Sort desc by end time
        
        if (!lastCompleted) return prev

        const nextTasks = [...prev.tasks]
        const taskIndex = nextTasks.findIndex(t => t.runtimeId === lastCompleted.runtimeId)
        
        // 1. Revert status to active
        // 2. Reset actualStartTime to NOW (elapsedSeconds) to restart timer
        nextTasks[taskIndex] = {
            ...lastCompleted,
            status: 'active',
            actualEndTime: undefined,
            actualStartTime: prev.elapsedSeconds // Restart timer!
        }

        // 3. If there was a task that got force-activated or auto-started, pause it
        const currentActive = chefTasks.find(t => t.status === 'active')
        if (currentActive) {
             const activeIndex = nextTasks.findIndex(t => t.runtimeId === currentActive.runtimeId)
             nextTasks[activeIndex] = {
                 ...currentActive,
                 status: 'pending',
                 forceActive: false
             }
        }
        
        // 4. Update assignments IMMEDIATELY
        const nextChefs = updateChefAssignments(nextTasks, prev.chefs, prev.elapsedSeconds)

        return { ...prev, tasks: nextTasks, chefs: nextChefs }
    })
  }

  if (!sessionData) return <div className="p-8">加载烹饪数据...</div>

  const isSingleChef = liveState.chefs.length === 1

  return (
    <div className="h-screen flex flex-col bg-[var(--color-page)]">
      {/* Header */}
      <div className="h-16 border-b border-[var(--color-border-theme)] flex items-center px-6 justify-between bg-[var(--color-card)] shrink-0">
        <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="px-4 py-1.5 rounded-full border border-[var(--color-border-theme)] text-sm font-bold text-[var(--color-muted)] hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)] transition-all"
            >
              返回
            </button>
          <h1 className="font-bold tracking-wider text-lg text-[var(--color-main)]">烹饪导航</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="font-mono text-xl font-bold text-[var(--color-accent)] flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {new Date(liveState.elapsedSeconds * 1000).toISOString().substr(11, 8)}
            </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className={`flex-1 grid ${isSingleChef ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x'} divide-[var(--color-border-theme)] overflow-hidden`}>
        {/* Chef A (Left/Top) */}
        <ChefView 
            chef={liveState.chefs[0]} 
            allTasks={liveState.tasks} 
            elapsedSeconds={liveState.elapsedSeconds}
            onComplete={handleCompleteTask}
            onUndo={() => handleUndo(liveState.chefs[0].id)}
            isSingleMode={isSingleChef}
        />

        {/* Chef B (Right/Bottom) - If exists */}
        {!isSingleChef && (
             liveState.chefs.length > 1 ? (
                <ChefView 
                    chef={liveState.chefs[1]} 
                    allTasks={liveState.tasks} 
                    elapsedSeconds={liveState.elapsedSeconds}
                    onComplete={handleCompleteTask}
                    onUndo={() => handleUndo(liveState.chefs[1].id)}
                    isSecondary
                />
            ) : (
                <div className="p-6 flex flex-col relative bg-[var(--color-card)]/50 items-center justify-center text-[var(--color-muted)]">
                    单人烹饪模式
                </div>
            )
        )}
      </div>

      {/* Footer Controls */}
      <div className="h-24 border-t border-[var(--color-border-theme)] bg-[var(--color-card)] flex items-center justify-center gap-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
            onClick={togglePlayPause}
            className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center hover:scale-105 transition-transform text-white shadow-lg shadow-[var(--color-accent)]/20"
        >
          {liveState.isPaused ? <Play className="h-8 w-8 ml-1" /> : <Pause className="h-8 w-8" />}
        </button>
      </div>
    </div>
  )
}

function ChefView({ chef, allTasks, elapsedSeconds, onComplete, onUndo, isSecondary = false, isSingleMode = false }: any) {
    const currentTask = allTasks.find((t: any) => t.runtimeId === chef.currentTaskId)
    const nextTask = allTasks.find((t: any) => t.runtimeId === chef.nextTaskId)

    return (
        <div className={`p-6 flex flex-col relative h-full ${isSecondary ? 'bg-[var(--color-card)]/30' : 'bg-[var(--color-page)]'}`}>
          <div className="absolute top-4 left-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest flex items-center gap-2">
            {isSecondary ? <User className="h-4 w-4" /> : <ChefHat className="h-4 w-4" />}
            {chef.name}
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center gap-8 mt-8">
            {currentTask ? (
                <div className={`w-full ${isSingleMode ? 'max-w-3xl' : 'max-w-md'} animate-in zoom-in-95 duration-300`}>
                    {/* Active Task Card */}
                    <div className={`bg-white border-2 border-[var(--color-accent)] rounded-[var(--radius-theme)] shadow-xl relative overflow-hidden group transition-all ${isSingleMode ? 'p-12' : 'p-8'}`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-accent)]" />
                        
                        {/* Recipe Tag */}
                        <div className="absolute top-4 right-4 px-2 py-1 bg-[var(--color-accent-light)]/20 text-[var(--color-accent)] text-xs font-bold rounded">
                            当前任务
                        </div>

                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4 text-[var(--color-muted)]">
                                {currentTask.step.type === 'cook' ? <Flame className="h-6 w-6 text-orange-500" /> : <CheckCircle className="h-6 w-6 text-green-500" />}
                                <span className="uppercase font-bold text-sm tracking-wider">{
                                    currentTask.step.type === 'cook' ? '烹饪' : 
                                    currentTask.step.type === 'prep' ? '备菜' : 
                                    currentTask.step.type === 'wait' ? '等待' : 
                                    currentTask.step.type === 'serve' ? '装盘' : currentTask.step.type
                                }</span>
                            </div>
                            <h2 className={`${isSingleMode ? 'text-6xl' : 'text-4xl'} font-bold text-[var(--color-main)] leading-tight`}>
                                {currentTask.step.instruction}
                            </h2>
                        </div>

                        {/* Countdown */}
                        <div className="flex items-end gap-2 mb-10">
                            <span className={`${isSingleMode ? 'text-8xl' : 'text-6xl'} font-mono font-bold text-[var(--color-main)]`}>
                                {Math.max(0, Math.ceil(currentTask.step.duration - (elapsedSeconds - currentTask.actualStartTime))).toString()}
                            </span>
                            <span className="text-xl text-[var(--color-muted)] mb-4">秒剩余</span>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-4">
                            <button 
                                onClick={onUndo}
                                className="px-6 py-4 border border-[var(--color-border-theme)] text-[var(--color-muted)] font-bold rounded-[var(--radius-theme)] hover:bg-black/5 transition-all flex items-center justify-center"
                                title="返回上一步"
                            >
                                <ChevronLeft className="h-8 w-8" />
                            </button>
                            
                            <button 
                                onClick={() => onComplete(currentTask.runtimeId)}
                                className="flex-1 py-4 bg-[var(--color-accent)] text-white font-bold rounded-[var(--radius-theme)] hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 text-2xl"
                            >
                                <CheckCircle className="h-8 w-8" />
                                完成步骤
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-[var(--color-muted)] text-center animate-pulse">
                    <Clock className="h-16 w-16 mx-auto mb-6 opacity-20" />
                    <p className="text-2xl font-medium">等待任务分配...</p>
                    <p className="text-base mt-2 opacity-60">正在等待前置步骤完成或时间点</p>
                </div>
            )}

            {/* Next Up */}
            {nextTask && (
                <div className={`w-full ${isSingleMode ? 'max-w-3xl' : 'max-w-md'} opacity-60 hover:opacity-100 transition-opacity`}>
                    <div className="text-xs font-bold text-[var(--color-muted)] uppercase mb-2 pl-1">下个任务</div>
                    <div className="bg-[var(--color-card)] border border-[var(--color-border-theme)] p-4 rounded-lg flex items-center justify-between cursor-pointer group"
                         onClick={() => {/* Optional: Allow peeking or jumping */}}
                    >
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-[var(--color-main)] text-xl group-hover:text-[var(--color-accent)] transition-colors">
                                {nextTask.step.instruction}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs bg-[var(--color-border-theme)] px-2 py-1 rounded text-[var(--color-muted)]">
                                {Math.round(nextTask.step.duration / 60)}分
                            </span>
                            <ChevronRight className="h-4 w-4 text-[var(--color-muted)]" />
                        </div>
                    </div>
                </div>
            )}
          </div>
        </div>
    )
}