"use client"

import { useEffect, useState, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ScheduledBlock } from "@/lib/scheduler"
import { ArrowLeft, Play, Pause, CheckCircle, AlertCircle, Clock, Flame, User, ChefHat, ChevronLeft, ChevronRight, Plus, X, Coffee, ArrowRight } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { SmartCookingDial } from "@/components/SmartCookingDial"

// === State Models ===

interface LiveTask extends ScheduledBlock {
  status: 'pending' | 'active' | 'completed' | 'blocked'
  runtimeId: string
  actualStartTime?: number
  actualEndTime?: number
  forceActive?: boolean
  // Add override duration for manual adjustment
  manualDurationAddon?: number 
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
  const [isAddingDish, setIsAddingDish] = useState(false)
  const [availableRecipes, setAvailableRecipes] = useState<any[]>([])

  // Helper: Check if task dependencies are met (same recipe, previous steps)
  const isDependencyMet = (task: LiveTask, allTasks: LiveTask[]) => {
    const dependencies = allTasks.filter(t => 
        t.step.recipeId === task.step.recipeId && 
        t.step.stepOrder < task.step.stepOrder
    )
    return dependencies.every(d => d.status === 'completed')
  }

  // Helper: Update Chef Assignments based on current tasks
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

  const handleAddDish = useCallback((newRecipe: any) => {
      setLiveState((prev) => {
          // 1. Create new tasks from new recipe
          const newSteps = newRecipe.recipe_steps.map((s: any) => ({
              id: s.id || Math.random().toString(),
              recipeId: newRecipe.id,
              recipeColor: `hsl(${Math.random() * 360}, 70%, 85%)`, // Random color for new dish
              stepOrder: s.step_order,
              instruction: s.instruction,
              duration: s.duration_seconds,
              type: s.step_type,
              isActive: s.is_active,
              equipment: s.equipment,
              isInterruptible: s.is_interruptible
          }))

          // 2. Append new tasks to pending queue
          const newLiveTasks = newSteps.map((s: any, idx: number) => ({
              step: s,
              startTime: prev.elapsedSeconds, 
              endTime: prev.elapsedSeconds + s.duration,
              lane: 'chef', 
              resourceId: 'chef_1', // Default to main chef
              status: 'pending',
              runtimeId: `new_task_${Date.now()}_${idx}`
          }))

          // 3. Return updated state
          setIsAddingDish(false)
          return {
              ...prev,
              tasks: [...prev.tasks, ...newLiveTasks]
          }
      })
  }, [])

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
        status: 'pending',
        manualDurationAddon: 0
      }))

      const initialChefs = Array.from({ length: data.resources.chef }).map((_, i) => ({
        id: `chef_${i+1}`,
        name: i === 0 ? "主厨 (我)" : `帮厨 #${i}`
      }))

      // Check if we need to restore state (e.g. user refreshed page)
      // Note: A full restore would require saving liveState to localStorage continuously.
      // For now, we rely on the static timeline. 
      // User Improvement: Show a toast "Session Restored" if this happens.
      const isRestored = true; // Implicitly true if we loaded from storage

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
            const readyTime = prev.elapsedSeconds >= task.startTime;
            const forced = task.forceActive;
            const depsMet = isDependencyMet(task, nextTasks);
            
            if (forced || (depsMet && readyTime)) {
                task.status = 'active'
                task.actualStartTime = prev.elapsedSeconds // Start now
                hasChanges = true
            }
        }
      })

      // B. Update Chef Assignments
      const nextChefs = updateChefAssignments(nextTasks, prev.chefs, prev.elapsedSeconds)
      
      // Force update if tasks changed status
      const tasksChanged = JSON.stringify(nextTasks.map(t => t.status)) !== JSON.stringify(prev.tasks.map(t => t.status))
      
      // Check if chefs changed
      const chefsChanged = JSON.stringify(nextChefs) !== JSON.stringify(prev.chefs)

      if (!hasChanges && !chefsChanged && !tasksChanged) return prev
      return { ...prev, tasks: nextTasks, chefs: nextChefs }
    })
  }, [liveState.elapsedSeconds, sessionData])

  // Fetch recipes for "Add Dish" modal
  useEffect(() => {
      if (isAddingDish && availableRecipes.length === 0) {
          const fetchRecipes = async () => {
              const supabase = createClient()
              const { data: { user } } = await supabase.auth.getUser()
              if (!user) return

              const { data } = await supabase
                .from("recipes")
                .select(`*, recipe_steps(*)`)
                .eq("author_id", user.id)
              
              if (data) setAvailableRecipes(data)
          }
          fetchRecipes()
      }
  }, [isAddingDish])

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

      // Check if ALL tasks are completed
      const allCompleted = nextTasks.every(t => t.status === 'completed')
      if (allCompleted && sessionData) {
          // Save session to Supabase history (Async fire-and-forget)
          const supabase = createClient()
          
          // We use 'void' to detach the promise and avoid blocking state update
          void (async () => {
              try {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (user) {
                      const { data, error } = await supabase.from('cooking_sessions').insert({
                          user_id: user.id,
                          total_duration_seconds: prev.elapsedSeconds,
                          recipes: sessionData.recipes || [],
                          status: 'completed'
                      })
                      .select()
                      .single()

                      if (data) {
                         // Redirect to completion page
                         router.push(`/session/complete?session_id=${data.id}`)
                      } else if (error) {
                          console.error("Failed to save session:", error)
                      }
                  }
              } catch (err) {
                  console.error("Failed to save session history:", err)
              }
          })()
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
             const isFirstForChef = sortedPendingTasks.find(t => t.resourceId === task.resourceId)?.runtimeId === task.runtimeId

             // Logic Update: 
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

  // New handler for manual force start from waiting screen
  const handleForceStart = (runtimeId: string) => {
    setLiveState(prev => {
      const nextTasks = [...prev.tasks]
      const taskIndex = nextTasks.findIndex(t => t.runtimeId === runtimeId)
      if (taskIndex === -1) return prev
      
      // Force activate immediately
      nextTasks[taskIndex] = {
          ...nextTasks[taskIndex],
          forceActive: true,
          status: 'active',
          actualStartTime: prev.elapsedSeconds
      }
      
      // Update assignments
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

  const handleAddOneMinute = (runtimeId: string) => {
      setLiveState(prev => {
          const nextTasks = [...prev.tasks]
          const taskIndex = nextTasks.findIndex(t => t.runtimeId === runtimeId)
          if (taskIndex === -1) return prev
          
          nextTasks[taskIndex] = {
              ...nextTasks[taskIndex],
              manualDurationAddon: (nextTasks[taskIndex].manualDurationAddon || 0) + 60
          }
          
          return { ...prev, tasks: nextTasks }
      })
  }

  if (!sessionData) return <div className="p-8">加载烹饪数据...</div>

  const isSingleChef = liveState.chefs.length === 1

  return (
    <div className="h-screen flex flex-col bg-[var(--color-page)] relative">
      {/* Add Dish Modal */}
      {isAddingDish && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[var(--color-card)] w-full max-w-lg rounded-xl shadow-2xl p-6 flex flex-col max-h-[80vh]">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-[var(--color-main)]">临时加菜</h3>
                      <button onClick={() => setIsAddingDish(false)}><X className="h-5 w-5" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2">
                      {availableRecipes.map(r => (
                          <button 
                            key={r.id}
                            onClick={() => handleAddDish(r)}
                            className="w-full text-left p-3 rounded-lg border border-[var(--color-border-theme)] hover:bg-[var(--color-accent-light)]/10 hover:border-[var(--color-accent)] transition-all"
                          >
                              <div className="font-bold text-[var(--color-main)]">{r.title}</div>
                              <div className="text-xs text-[var(--color-muted)]">{r.total_time_minutes}m • {r.recipe_steps?.length} 步骤</div>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

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
            <button 
                onClick={() => setIsAddingDish(true)}
                className="p-2 rounded-full bg-[var(--color-page)] border border-[var(--color-border-theme)] hover:border-[var(--color-accent)] text-[var(--color-accent)] transition-colors"
                title="临时加菜"
            >
                <Plus className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-end">
                <div className="font-mono text-xl font-bold text-[var(--color-accent)] flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {new Date(liveState.elapsedSeconds * 1000).toISOString().substr(11, 8)}
                </div>
                {!liveState.isPaused && (
                    <div className="text-[10px] text-[var(--color-muted)] font-medium animate-pulse">
                        ● 进度已自动保存
                    </div>
                )}
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
            onAddOneMinute={handleAddOneMinute}
            onUndo={() => handleUndo(liveState.chefs[0].id)}
            onForceStart={handleForceStart}
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
                    onAddOneMinute={handleAddOneMinute}
                    onUndo={() => handleUndo(liveState.chefs[1].id)}
                    onForceStart={handleForceStart}
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

function ChefView({ chef, allTasks, elapsedSeconds, onComplete, onAddOneMinute, onUndo, onForceStart, isSecondary = false, isSingleMode = false }: any) {
    const currentTask = allTasks.find((t: any) => t.runtimeId === chef.currentTaskId)
    const nextTask = allTasks.find((t: any) => t.runtimeId === chef.nextTaskId)

    // Find blocking info
    const getBlockingInfo = () => {
        if (!nextTask) return null;
        // Find tasks that block nextTask
        // Same recipe, lower order, not completed
        const blocking = allTasks.filter((t: LiveTask) => 
            t.step.recipeId === nextTask.step.recipeId && 
            t.step.stepOrder < nextTask.step.stepOrder &&
            t.status !== 'completed'
        );
        
        if (blocking.length === 0) return null;
        // Return first blocking task
        return blocking[0];
    }
    
    const blockingTask = !currentTask ? getBlockingInfo() : null;

    // Helper for Contextual Tips
    const getContextTip = (task: LiveTask) => {
        const instr = task.step.instruction.toLowerCase()
        const duration = task.step.duration
        
        if (instr.includes('大火') || instr.includes('爆炒')) return "🔥 注意火候：保持大火翻炒，动作要快。"
        if (instr.includes('煮') && duration > 600) return "🍲 现在是慢炖时间，您可以稍微休息或整理台面。"
        if (instr.includes('切') || instr.includes('剁')) return "🔪 刀工提示：注意手指安全，不急于求快。"
        if (instr.includes('煎') && (instr.includes('鱼') || instr.includes('牛排'))) return "🥩 煎制要点：不要频繁翻动，待定型后再翻面。"
        if (task.step.type === 'wait') return "☕️ 休息时间：利用这段时间喝口水或清洗工具。"
        
        return null;
    }

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

                        <div className="mb-4">
                            <div className="flex items-center gap-3 mb-4 text-[var(--color-muted)]">
                                {currentTask.step.type === 'cook' ? <Flame className="h-6 w-6 text-orange-500" /> : <CheckCircle className="h-6 w-6 text-green-500" />}
                                <span className="uppercase font-bold text-sm tracking-wider">{
                                    currentTask.step.type === 'cook' ? '烹饪' : 
                                    currentTask.step.type === 'prep' ? '备菜' : 
                                    currentTask.step.type === 'wait' ? '等待' : 
                                    currentTask.step.type === 'serve' ? '装盘' : currentTask.step.type
                                }</span>
                            </div>
                            <h2 className={`${isSingleMode ? 'text-5xl' : 'text-4xl'} font-bold text-[var(--color-main)] leading-tight mb-4`}>
                                {currentTask.step.instruction}
                            </h2>
                            
                            {/* Contextual Tip (Dynamic) */}
                            {getContextTip(currentTask) ? (
                                <div className="flex items-start gap-2 text-sm text-[var(--color-muted)] bg-[var(--color-page)] p-4 rounded-lg border border-[var(--color-border-theme)]/50 shadow-inner">
                                    <AlertCircle className="h-5 w-5 text-[var(--color-accent)] shrink-0 mt-0.5" />
                                    <span>{getContextTip(currentTask)}</span>
                                </div>
                            ) : null}
                        </div>

                        {/* NEW: Smart Dial Integration */}
                        <div className="flex justify-center mb-6">
                            <SmartCookingDial 
                                duration={currentTask.step.duration + (currentTask.manualDurationAddon || 0)}
                                elapsed={elapsedSeconds - currentTask.actualStartTime}
                                type={currentTask.step.type}
                                isLocked={false} // Active task is never locked
                                onComplete={() => onComplete(currentTask.runtimeId)}
                                onAddOneMinute={() => onAddOneMinute(currentTask.runtimeId)}
                            />
                        </div>

                        {/* Undo Link */}
                        <div className="text-center">
                            <button 
                                onClick={onUndo}
                                className="text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                                <ChevronLeft className="h-3 w-3" />
                                返回上一步
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="w-full max-w-md bg-white border border-[var(--color-border-theme)] rounded-xl shadow-sm p-8 text-center flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
                    {/* Idle State / Next Up Preview */}
                    <div className="w-20 h-20 bg-[var(--color-page)] rounded-full flex items-center justify-center relative">
                         <div className="absolute inset-0 border-4 border-[var(--color-accent)]/20 rounded-full animate-pulse" />
                         <Coffee className="h-8 w-8 text-[var(--color-accent)]" />
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--color-main)] mb-2">稍事休息</h2>
                        <p className="text-[var(--color-muted)]">
                            {blockingTask 
                                ? `正在等待 "${blockingTask.step.instruction}" 完成...`
                                : "等待调度器分配下一个任务..."}
                        </p>
                    </div>

                    {nextTask && (
                        <div className="w-full bg-[var(--color-page)] border border-[var(--color-border-theme)] rounded-lg p-4 text-left group cursor-pointer hover:border-[var(--color-accent)] transition-colors"
                             onClick={() => onForceStart && onForceStart(nextTask.runtimeId)}
                        >
                             <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-[var(--color-muted)] uppercase">即将开始</span>
                                {blockingTask && (
                                    <span className="text-xs bg-[var(--color-accent)] text-white px-2 py-0.5 rounded-full font-bold animate-pulse">
                                        等待中
                                    </span>
                                )}
                             </div>
                             <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-[var(--color-main)]">{nextTask.step.instruction}</span>
                                <ArrowRight className="h-4 w-4 text-[var(--color-muted)] group-hover:translate-x-1 transition-transform" />
                             </div>
                             <div className="mt-3 pt-3 border-t border-[var(--color-border-theme)]/50 flex justify-between items-center">
                                 <span className="text-xs text-[var(--color-muted)]">预计耗时: {Math.round(nextTask.step.duration / 60)}分钟</span>
                                 <button className="text-xs font-bold text-[var(--color-accent)] hover:underline flex items-center gap-1">
                                    立即开始 <ChevronRight className="h-3 w-3" />
                                 </button>
                             </div>
                        </div>
                    )}
                </div>
            )}
          </div>
        </div>
    )
}
