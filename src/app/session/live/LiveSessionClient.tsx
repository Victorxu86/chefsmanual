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
        // Add unique ID for runtime tracking if not present
        runtimeId: `task_${index}`,
        status: 'pending'
      }))

      const initialChefs = Array.from({ length: data.resources.chef }).map((_, i) => ({
        id: `chef_${i+1}`,
        name: i === 0 ? "主厨 (Main)" : `帮厨 #${i}`
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
      const nextChefs = [...prev.chefs]
      let hasChanges = false

      // A. Identify Active Tasks
      // Logic: Task starts if time >= startTime AND task is pending 
      // OR if it is forced active (manual override)
      nextTasks.forEach(task => {
        if (task.status === 'pending') {
            // Check previous task for this chef
            // If previous task is completed, we can potentially auto-start this one if it's the immediate next
            // But for now, we rely on forceActive or time
            
            if (prev.elapsedSeconds >= task.startTime || task.forceActive) {
                task.status = 'active'
                // If forced, we might be starting early, so actStartTime is now
                task.actualStartTime = prev.elapsedSeconds
                hasChanges = true
            }
        }
      })

      // B. Update Chef Assignments
      nextChefs.forEach(chef => {
        // Find active task for this chef
        const activeTask = nextTasks.find(t => t.status === 'active' && t.resourceId === chef.id)
        
        // Find next pending task (that is NOT active)
        // We sort by startTime to get the true next
        const nextTask = nextTasks
            .filter(t => t.status === 'pending' && t.resourceId === chef.id)
            .sort((a, b) => a.startTime - b.startTime)[0]
        
        if (chef.currentTaskId !== activeTask?.runtimeId || chef.nextTaskId !== nextTask?.runtimeId) {
            chef.currentTaskId = activeTask?.runtimeId
            chef.nextTaskId = nextTask?.runtimeId
            hasChanges = true
        }
      })

      if (!hasChanges) return prev
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

      // 2. Find next task for this chef and FORCE ACTIVE it
      // This ensures smooth transition without waiting for scheduler time
      const nextTaskIndex = nextTasks.findIndex(t => 
        t.resourceId === completedTask.resourceId && 
        t.status === 'pending'
      )
      
      if (nextTaskIndex !== -1) {
        // Check if we should activate it. 
        // For now, we always activate the immediate next task for the chef to keep flow going.
        // In a more complex system, we'd check dependencies from other chefs.
        nextTasks[nextTaskIndex] = {
            ...nextTasks[nextTaskIndex],
            forceActive: true
        }
      }

      return { ...prev, tasks: nextTasks }
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
        nextTasks[taskIndex] = {
            ...lastCompleted,
            status: 'active',
            actualEndTime: undefined
        }

        // 2. If there was a task that got force-activated or auto-started, we should probably pause it?
        // For simplicity, if there is currently an active task (which implies we moved on), we push it back to pending
        const currentActive = chefTasks.find(t => t.status === 'active')
        if (currentActive) {
             const activeIndex = nextTasks.findIndex(t => t.runtimeId === currentActive.runtimeId)
             nextTasks[activeIndex] = {
                 ...currentActive,
                 status: 'pending',
                 forceActive: false
             }
        }

        return { ...prev, tasks: nextTasks }
    })
  }

  if (!sessionData) return <div className="p-8">Loading mission data...</div>

  const isSingleChef = liveState.chefs.length === 1

  return (
    <div className="h-screen flex flex-col bg-[var(--color-page)]">
      {/* Header */}
      <div className="h-16 border-b border-[var(--color-border-theme)] flex items-center px-6 justify-between bg-[var(--color-card)] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-black/5 rounded-full text-[var(--color-main)] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-bold tracking-wider text-lg text-[var(--color-main)]">LIVE COOKING SESSION</h1>
        </div>
        <div className="font-mono text-xl font-bold text-[var(--color-accent)] flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {new Date(liveState.elapsedSeconds * 1000).toISOString().substr(11, 8)}
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
                    Single Chef Mode
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
                                <span className="uppercase font-bold text-sm tracking-wider">{currentTask.step.type}</span>
                            </div>
                            <h2 className={`${isSingleMode ? 'text-5xl' : 'text-3xl'} font-bold text-[var(--color-main)] leading-tight`}>
                                {currentTask.step.instruction}
                            </h2>
                        </div>

                        {/* Countdown */}
                        <div className="flex items-end gap-2 mb-10">
                            <span className={`${isSingleMode ? 'text-7xl' : 'text-5xl'} font-mono font-bold text-[var(--color-main)]`}>
                                {Math.max(0, Math.ceil(currentTask.step.duration - (elapsedSeconds - currentTask.actualStartTime))).toString()}
                            </span>
                            <span className="text-lg text-[var(--color-muted)] mb-3">sec left</span>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-4">
                            <button 
                                onClick={onUndo}
                                className="px-4 py-4 border border-[var(--color-border-theme)] text-[var(--color-muted)] font-bold rounded-[var(--radius-theme)] hover:bg-black/5 transition-all flex items-center justify-center"
                                title="返回上一步"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                            
                            <button 
                                onClick={() => onComplete(currentTask.runtimeId)}
                                className="flex-1 py-4 bg-[var(--color-accent)] text-white font-bold rounded-[var(--radius-theme)] hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 text-xl"
                            >
                                <CheckCircle className="h-6 w-6" />
                                完成步骤
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-[var(--color-muted)] text-center animate-pulse">
                    <Clock className="h-16 w-16 mx-auto mb-6 opacity-20" />
                    <p className="text-xl font-medium">等待任务分配...</p>
                    <p className="text-sm mt-2 opacity-60">系统正在为您安排最佳时机</p>
                </div>
            )}

            {/* Next Up */}
            {nextTask && (
                <div className={`w-full ${isSingleMode ? 'max-w-3xl' : 'max-w-md'} opacity-60 hover:opacity-100 transition-opacity`}>
                    <div className="text-xs font-bold text-[var(--color-muted)] uppercase mb-2 pl-1">Next Up</div>
                    <div className="bg-[var(--color-card)] border border-[var(--color-border-theme)] p-4 rounded-lg flex items-center justify-between cursor-pointer group"
                         onClick={() => {/* Optional: Allow peeking or jumping */}}
                    >
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-[var(--color-main)] text-lg group-hover:text-[var(--color-accent)] transition-colors">
                                {nextTask.step.instruction}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs bg-[var(--color-border-theme)] px-2 py-1 rounded text-[var(--color-muted)]">
                                {Math.round(nextTask.step.duration / 60)}m
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

