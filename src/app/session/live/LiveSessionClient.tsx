"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ScheduledBlock } from "@/lib/scheduler"
import { ArrowLeft, Play, Pause, CheckCircle, AlertCircle, Clock, Flame, User, ChefHat } from "lucide-react"

// === State Models ===

interface LiveTask extends ScheduledBlock {
  status: 'pending' | 'active' | 'completed' | 'blocked'
  runtimeId: string
  actualStartTime?: number
  actualEndTime?: number
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
      // Logic: Task starts if time >= startTime AND task is pending AND dependencies met (simplified: just time for now)
      nextTasks.forEach(task => {
        if (task.status === 'pending' && prev.elapsedSeconds >= task.startTime) {
          task.status = 'active'
          task.actualStartTime = prev.elapsedSeconds
          hasChanges = true
        }
      })

      // B. Update Chef Assignments
      nextChefs.forEach(chef => {
        // Find active task for this chef
        const activeTask = nextTasks.find(t => t.status === 'active' && t.resourceId === chef.id)
        // Find next pending task
        const nextTask = nextTasks.find(t => t.status === 'pending' && t.resourceId === chef.id && t.startTime > prev.elapsedSeconds)
        
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
      const nextTasks = prev.tasks.map(t => 
        t.runtimeId === runtimeId 
          ? { ...t, status: 'completed' as const, actualEndTime: prev.elapsedSeconds } 
          : t
      )
      return { ...prev, tasks: nextTasks }
    })
  }

  if (!sessionData) return <div className="p-8">Loading mission data...</div>

  return (
    <div className="h-screen flex flex-col bg-[var(--color-page)]">
      {/* Header */}
      <div className="h-16 border-b border-[var(--color-border-theme)] flex items-center px-6 justify-between bg-[var(--color-card)]">
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
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border-theme)]">
        {/* Chef A (Left/Top) */}
        <ChefView 
            chef={liveState.chefs[0]} 
            allTasks={liveState.tasks} 
            elapsedSeconds={liveState.elapsedSeconds}
            onComplete={handleCompleteTask}
        />

        {/* Chef B (Right/Bottom) - If exists */}
        {liveState.chefs.length > 1 ? (
            <ChefView 
                chef={liveState.chefs[1]} 
                allTasks={liveState.tasks} 
                elapsedSeconds={liveState.elapsedSeconds}
                onComplete={handleCompleteTask}
                isSecondary
            />
        ) : (
            <div className="p-6 flex flex-col relative bg-[var(--color-card)]/50 items-center justify-center text-[var(--color-muted)]">
                Single Chef Mode
            </div>
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

function ChefView({ chef, allTasks, elapsedSeconds, onComplete, isSecondary = false }: any) {
    const currentTask = allTasks.find((t: any) => t.runtimeId === chef.currentTaskId)
    const nextTask = allTasks.find((t: any) => t.runtimeId === chef.nextTaskId)

    return (
        <div className={`p-6 flex flex-col relative ${isSecondary ? 'bg-[var(--color-card)]/30' : 'bg-[var(--color-page)]'}`}>
          <div className="absolute top-4 left-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest flex items-center gap-2">
            {isSecondary ? <User className="h-4 w-4" /> : <ChefHat className="h-4 w-4" />}
            {chef.name}
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center gap-8 mt-8">
            {currentTask ? (
                <div className="w-full max-w-md animate-in zoom-in-95 duration-300">
                    {/* Active Task Card */}
                    <div className="bg-white border-2 border-[var(--color-accent)] rounded-[var(--radius-theme)] p-8 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-accent)]" />
                        
                        {/* Recipe Tag */}
                        <div className="absolute top-4 right-4 px-2 py-1 bg-[var(--color-accent-light)]/20 text-[var(--color-accent)] text-xs font-bold rounded">
                            {/* We need to lookup recipe title, simpler for now to use color */}
                            TASK
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2 text-[var(--color-muted)]">
                                {currentTask.step.type === 'cook' ? <Flame className="h-5 w-5 text-orange-500" /> : <CheckCircle className="h-5 w-5" />}
                                <span className="uppercase font-bold text-xs tracking-wider">{currentTask.step.type}</span>
                            </div>
                            <h2 className="text-3xl font-bold text-[var(--color-main)] leading-tight">
                                {currentTask.step.instruction}
                            </h2>
                        </div>

                        {/* Countdown */}
                        <div className="flex items-end gap-2 mb-8">
                            <span className="text-5xl font-mono font-bold text-[var(--color-main)]">
                                {Math.max(0, Math.ceil(currentTask.step.duration - (elapsedSeconds - currentTask.actualStartTime))).toString()}
                            </span>
                            <span className="text-lg text-[var(--color-muted)] mb-2">sec left</span>
                        </div>

                        {/* Complete Button */}
                        <button 
                            onClick={() => onComplete(currentTask.runtimeId)}
                            className="w-full py-4 bg-[var(--color-accent)] text-white font-bold rounded-[var(--radius-theme)] hover:opacity-90 active:scale-95 transition-all shadow-lg"
                        >
                            完成步骤
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-[var(--color-muted)] text-center animate-pulse">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>等待任务分配...</p>
                </div>
            )}

            {/* Next Up */}
            {nextTask && (
                <div className="w-full max-w-md opacity-60 hover:opacity-100 transition-opacity">
                    <div className="text-xs font-bold text-[var(--color-muted)] uppercase mb-2 pl-1">Next Up</div>
                    <div className="bg-[var(--color-card)] border border-[var(--color-border-theme)] p-4 rounded-lg flex items-center justify-between">
                        <span className="font-bold text-[var(--color-main)]">{nextTask.step.instruction}</span>
                        <span className="text-xs bg-[var(--color-border-theme)] px-2 py-1 rounded text-[var(--color-muted)]">
                            {Math.round(nextTask.step.duration / 60)}m
                        </span>
                    </div>
                </div>
            )}
          </div>
        </div>
    )
}

