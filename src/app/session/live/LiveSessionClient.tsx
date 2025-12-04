"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ScheduledBlock } from "@/lib/scheduler"
import { ArrowLeft, Play, Pause, CheckCircle, AlertCircle } from "lucide-react"

// === State Models ===

interface LiveTask extends ScheduledBlock {
  status: 'pending' | 'active' | 'completed' | 'blocked'
  actualStartTime?: number
  actualEndTime?: number
}

interface ChefState {
  id: string // e.g. "chef_1"
  name: string // e.g. "Main Chef"
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
      
      // Initialize Live State
      const initialTasks = data.timeline.map((block: any) => ({
        ...block,
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
        <div className="font-mono text-xl font-bold text-[var(--color-accent)]">
          {new Date(liveState.elapsedSeconds * 1000).toISOString().substr(11, 8)}
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-border-theme)]">
        {/* Chef A (Left/Top) */}
        <div className="p-6 flex flex-col relative bg-[var(--color-page)]">
          <div className="absolute top-4 left-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Chef A (Main)</div>
          <div className="flex-1 flex items-center justify-center text-[var(--color-muted)]">
            Waiting for start...
          </div>
        </div>

        {/* Chef B (Right/Bottom) - If exists */}
        <div className="p-6 flex flex-col relative bg-[var(--color-card)]/50">
          <div className="absolute top-4 left-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Chef B (Sous)</div>
           <div className="flex-1 flex items-center justify-center text-[var(--color-muted)]">
            {liveState.chefs.length > 1 ? "Waiting for start..." : "Single Chef Mode"}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="h-24 border-t border-[var(--color-border-theme)] bg-[var(--color-card)] flex items-center justify-center gap-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center hover:scale-105 transition-transform text-white shadow-lg shadow-[var(--color-accent)]/20">
          <Play className="h-8 w-8 ml-1" />
        </button>
      </div>
    </div>
  )
}

