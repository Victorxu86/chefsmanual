"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"
import { ArrowLeft, Share2, Clock, Zap, Award, Calendar, Home, History } from "lucide-react"
import { useMode } from "@/context/ModeContext"

interface CompletionClientProps {
  session: {
    id: string
    created_at: string
    total_duration_seconds: number
    recipes: any[]
  }
}

export function CompletionClient({ session }: CompletionClientProps) {
  const { mode } = useMode()
  const router = useRouter()
  const [showShareTooltip, setShowShareTooltip] = useState(false)

  // 1. 触发庆祝动画
  useEffect(() => {
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: mode === 'business' ? ['#00ff9d', '#ffffff', '#000000'] : ['#ff6b6b', '#ffd93d', '#6c5ce7']
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: mode === 'business' ? ['#00ff9d', '#ffffff', '#000000'] : ['#ff6b6b', '#ffd93d', '#6c5ce7']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()
  }, [mode])

  // 2. 数据计算
  const stats = useMemo(() => {
    // 实际耗时
    const actualSeconds = session.total_duration_seconds || 0
    
    // 理论串行耗时 (sum of all recipe durations)
    let serialSeconds = 0
    session.recipes.forEach((r: any) => {
        // 优先使用 total_time_minutes，如果没有则累加 steps
        if (r.total_time_minutes) {
            serialSeconds += r.total_time_minutes * 60
        } else if (r.recipe_steps) {
            serialSeconds += r.recipe_steps.reduce((sum: number, s: any) => sum + (s.duration_seconds || 0), 0)
        }
    })

    // 防止 serialSeconds 为 0 或小于 actual (虽然理论上并行肯定小于串行，但数据可能有误)
    if (serialSeconds < actualSeconds) serialSeconds = actualSeconds

    const savedSeconds = Math.max(0, serialSeconds - actualSeconds)
    const efficiency = serialSeconds > 0 ? Math.round((savedSeconds / serialSeconds) * 100) : 0
    
    return {
        actualFormatted: formatDuration(actualSeconds),
        serialFormatted: formatDuration(serialSeconds),
        savedFormatted: formatDuration(savedSeconds),
        efficiency
    }
  }, [session])

  const handleShare = () => {
    const text = `🍳 我刚刚完成了 ${session.recipes.length} 道菜的烹饪挑战！\n` +
      `⏱️ 实际耗时: ${stats.actualFormatted}\n` +
      `⚡️ 效率提升: ${stats.efficiency}%\n` +
      `🍽️ 包含菜品: ${session.recipes.map((r: any) => r.title).join(", ")}\n` +
      `#ChefsManual #CookingWithData`
    
    navigator.clipboard.writeText(text).then(() => {
      setShowShareTooltip(true)
      setTimeout(() => setShowShareTooltip(false), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-[var(--color-page)] flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-700">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
         <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--color-accent)]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
         <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--color-accent)]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="w-full max-w-2xl relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-[var(--color-accent)]/10 text-[var(--color-accent)] mb-6 shadow-sm">
            <Award className="h-12 w-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-main)] mb-3 tracking-tight">
            {mode === 'personal' ? '烹饪完成！' : 'SESSION_COMPLETED'}
          </h1>
          <p className="text-[var(--color-muted)] text-lg">
            {mode === 'personal' 
              ? '美味即将上桌，享受您的成果吧' 
              : `Sequence finalized. Efficiency rating: ${stats.efficiency}%`}
          </p>
        </div>

        {/* Stats Card */}
        <div className="glass-panel rounded-2xl p-8 mb-8 shadow-xl border border-[var(--color-border-theme)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Stat */}
            <div className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-[var(--color-page)]/50 border border-[var(--color-border-theme)]/50">
              <span className="text-[var(--color-muted)] text-sm font-bold uppercase tracking-wider mb-2">
                {mode === 'personal' ? '总耗时' : 'TOTAL_RUNTIME'}
              </span>
              <div className="text-3xl font-bold text-[var(--color-main)] font-mono flex items-center gap-2">
                <Clock className="h-6 w-6 text-[var(--color-accent)]" />
                {stats.actualFormatted}
              </div>
            </div>

            {/* Efficiency Stat */}
            <div className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--color-accent)]/5" />
              <span className="text-[var(--color-accent)] text-sm font-bold uppercase tracking-wider mb-2 relative z-10">
                {mode === 'personal' ? '节省时间' : 'TIME_SAVED'}
              </span>
              <div className="text-3xl font-bold text-[var(--color-accent)] font-mono flex items-center gap-2 relative z-10">
                <Zap className="h-6 w-6" />
                {stats.savedFormatted}
              </div>
              <div className="text-xs text-[var(--color-accent)]/80 mt-1 font-medium relative z-10">
                效率提升 {stats.efficiency}%
              </div>
            </div>

            {/* Date Stat */}
            <div className="flex flex-col items-center justify-center text-center p-4 rounded-xl bg-[var(--color-page)]/50 border border-[var(--color-border-theme)]/50">
              <span className="text-[var(--color-muted)] text-sm font-bold uppercase tracking-wider mb-2">
                {mode === 'personal' ? '日期' : 'TIMESTAMP'}
              </span>
              <div className="text-lg font-bold text-[var(--color-main)] font-mono flex items-center gap-2 h-[36px]">
                {new Date(session.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Recipes List */}
        <div className="mb-10">
          <h3 className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-4 pl-2">
            {mode === 'personal' ? '完成菜单' : 'EXECUTED_RECIPES'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {session.recipes.map((recipe: any) => (
              <div key={recipe.id} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--color-card)] border border-[var(--color-border-theme)] shadow-sm hover:shadow-md transition-all">
                 {/* Placeholder or Image */}
                 <div className="h-12 w-12 rounded-lg bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)] font-bold text-lg shrink-0">
                    {recipe.title.charAt(0)}
                 </div>
                 <div className="min-w-0">
                    <h4 className="font-bold text-[var(--color-main)] truncate">{recipe.title}</h4>
                    <p className="text-xs text-[var(--color-muted)]">
                       {recipe.total_time_minutes ? `${recipe.total_time_minutes} min` : 'Standard'} • {recipe.difficulty || 'Medium'}
                    </p>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="px-8 py-3 rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] text-[var(--color-main)] font-bold hover:bg-[var(--color-card)] transition-all flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              {mode === 'personal' ? '返回首页' : 'HOME_BASE'}
            </Link>

            <button 
              onClick={handleShare}
              className="px-8 py-3 rounded-[var(--radius-theme)] bg-[var(--color-main)] text-[var(--color-page)] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 relative group"
            >
              <Share2 className="h-5 w-5" />
              {mode === 'personal' ? '分享成果' : 'EXPORT_LOG'}
              
              {/* Tooltip */}
              {showShareTooltip && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[var(--color-accent)] text-white text-xs rounded font-bold whitespace-nowrap animate-in fade-in zoom-in-95">
                  已复制到剪贴板!
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--color-accent)]" />
                </div>
              )}
            </button>
        </div>

      </div>
    </div>
  )
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`
  const h = Math.floor(m / 60)
  const remM = m % 60
  return `${h}h ${remM}m`
}

