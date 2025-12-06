"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ScheduledBlock } from "@/lib/scheduler"
import { ArrowLeft, Play, Pause, CheckCircle, AlertCircle, Clock, Flame, User, ChefHat, ChevronLeft, ChevronRight, Plus } from "lucide-react"

// ... (Existing imports)

// Add Recipe Picker for "Add Dish"
import { useMemo } from "react"

// ... (State Models)

export function LiveSessionClient() {
  // ... (Existing state)
  const [isAddingDish, setIsAddingDish] = useState(false)
  const [availableRecipes, setAvailableRecipes] = useState<any[]>([])

  // ... (Existing effects)

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

  const handleAddDish = (newRecipe: any) => {
      setLiveState(prev => {
          // 1. Identify "Locked" Tasks (Completed or Active)
          const lockedTasks = prev.tasks.filter(t => t.status === 'completed' || t.status === 'active')
          
          // 2. Identify "Pending" Tasks (To be rescheduled)
          const pendingTasks = prev.tasks.filter(t => t.status === 'pending')

          // 3. Create new tasks from new recipe
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

          // 4. Merge pending + new tasks for rescheduling
          // We need to call the Scheduler here. 
          // Ideally, we should refactor Scheduler to accept "fixed start time" constraint.
          // For MVP: We just append the new tasks to the end of the current timeline 
          // OR we simple re-run schedule but shift the startTime by current elapsedSeconds.
          
          // Simple Strategy: Append new tasks to the "Pending" queue, sorted by their internal order
          // And assign them to chefs greedily.
          
          // Actually, let's just add them as pending tasks with a naive start time (now)
          // The existing "Force Active" and "Dependency" logic will handle the execution flow.
          // We just need to make sure they have valid resourceIds.
          
          const newLiveTasks = newSteps.map((s: any, idx: number) => ({
              step: s,
              startTime: prev.elapsedSeconds, // Nominally start now
              endTime: prev.elapsedSeconds + s.duration,
              lane: 'chef', // Default lane
              resourceId: 'chef_1', // Default to main chef for now
              status: 'pending',
              runtimeId: `new_task_${Date.now()}_${idx}`
          }))

          // 5. Return updated state
          setIsAddingDish(false)
          return {
              ...prev,
              tasks: [...prev.tasks, ...newLiveTasks]
          }
      })
  }

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

function ChefView({ chef, allTasks, elapsedSeconds, onComplete, onUndo, onForceStart, isSecondary = false, isSingleMode = false }: any) {
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
                            <h2 className={`${isSingleMode ? 'text-6xl' : 'text-4xl'} font-bold text-[var(--color-main)] leading-tight mb-4`}>
                                {currentTask.step.instruction}
                            </h2>
                            
                            {/* Reasoning Hint */}
                            <div className="flex items-start gap-2 text-xs text-[var(--color-muted)] bg-[var(--color-page)] p-3 rounded-lg border border-[var(--color-border-theme)]/50">
                                <AlertCircle className="h-4 w-4 text-[var(--color-accent)] shrink-0 mt-0.5" />
                                <span>
                                    {currentTask.step.type === 'cook' && currentTask.step.duration > 300 
                                        ? "此步骤耗时较长，请保持关注，系统可能会在间隙安排其他备菜任务。"
                                        : currentTask.step.type === 'prep'
                                        ? "这是关键备料步骤，完成后将解锁后续的烹饪环节。"
                                        : "按照指引完成操作，点击完成后即可进入下一步。"
                                    }
                                </span>
                            </div>
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
                <div className="text-[var(--color-muted)] text-center flex flex-col items-center gap-4">
                    <Clock className="h-16 w-16 opacity-20 animate-pulse" />
                    <div>
                        <p className="text-2xl font-medium animate-pulse">等待任务分配...</p>
                        {blockingTask ? (
                            <div className="mt-4 bg-[var(--color-card)] border border-[var(--color-border-theme)] p-4 rounded-xl inline-flex flex-col items-center gap-2 text-sm shadow-sm animate-in zoom-in-95">
                                <div className="flex items-center gap-2">
                                    <span className="opacity-80">等待:</span>
                                    <span className="font-bold text-[var(--color-main)]">{blockingTask.step.instruction}</span>
                                    <span className="text-xs bg-black/5 px-2 py-0.5 rounded font-mono font-bold">
                                        {/* Real-time countdown of blocking task */}
                                        {blockingTask.status === 'active' 
                                            ? Math.max(0, Math.ceil(blockingTask.step.duration - (elapsedSeconds - (blockingTask.actualStartTime || 0)))) + 's'
                                            : Math.round(blockingTask.step.duration/60) + 'm'
                                        }
                                    </span>
                                </div>
                                {onForceStart && nextTask && (
                                    <button 
                                        onClick={() => onForceStart(nextTask.runtimeId)}
                                        className="w-full px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2"
                                    >
                                        立即开始
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="mt-4 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                                <p className="text-base opacity-60">正在等待时间点或调度...</p>
                                {onForceStart && nextTask && (
                                    <button 
                                        onClick={() => onForceStart(nextTask.runtimeId)}
                                        className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-full text-sm font-bold hover:opacity-90 transition-opacity shadow-lg flex items-center gap-2"
                                    >
                                        跳过等待，立即开始
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Next Up */}
            {nextTask && (
                <div className={`w-full ${isSingleMode ? 'max-w-3xl' : 'max-w-md'} opacity-60 hover:opacity-100 transition-opacity`}>
                    <div className="text-xs font-bold text-[var(--color-muted)] uppercase mb-2 pl-1">下个任务</div>
                    <div className="bg-[var(--color-card)] border border-[var(--color-border-theme)] p-4 rounded-lg flex items-center justify-between cursor-pointer group"
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