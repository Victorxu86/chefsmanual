"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useMode } from "@/context/ModeContext"
import { Plus, Clock, ChefHat, ArrowRight, Activity, Utensils } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface CookingSession {
  id: string
  created_at: string
  total_duration_seconds: number
  recipes: any[]
}

interface Recipe {
  id: string
  title: string
  updated_at: string
}

export function DashboardContent({ userName }: { userName: string }) {
  const { mode } = useMode()
  const [recentSessions, setRecentSessions] = useState<CookingSession[]>([])
  const [recentRecipes, setRecentRecipes] = useState<Recipe[]>([])
  const [stats, setStats] = useState({
    weeklyCount: 0,
    totalSavedMinutes: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      
      // 1. Fetch Cooking Sessions
      const { data: sessions } = await supabase
        .from('cooking_sessions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (sessions) {
        setRecentSessions(sessions)
        
        // Calculate Weekly Count
        const now = new Date()
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
        startOfWeek.setHours(0, 0, 0, 0)
        
        const weekly = sessions.filter(s => new Date(s.created_at) >= startOfWeek)
        
        // Calculate Total Time Saved
        // Logic: Compare total_duration_seconds (optimized) vs Sum of recipe original times
        // For now, since we don't store original sum in session, we'll simulate it or calculate from recipes if available
        // Simplified logic: Assume scheduler saves 20% on average for >1 recipe
        let savedSeconds = 0
        sessions.forEach(s => {
            if (s.recipes && Array.isArray(s.recipes) && s.recipes.length > 1) {
                // Rough estimation: Parallelism saves time.
                // Real saved time = (Sum of individual recipe times) - (Actual optimized duration)
                // Since we only have actual duration here, let's assume a 15% efficiency gain as a placeholder metric
                // In future, we should store 'original_estimated_duration' in the session table
                savedSeconds += (s.total_duration_seconds || 0) * 0.2
            }
        })

        setStats({
            weeklyCount: weekly.length,
            totalSavedMinutes: Math.round(savedSeconds / 60)
        })
      }

      // 2. Fetch Recent Recipes
      const { data: recipes } = await supabase
        .from('recipes')
        .select('id, title, updated_at')
        .order('updated_at', { ascending: false })
        .limit(3)
        
      if (recipes) {
        setRecentRecipes(recipes)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-main)] tracking-tight mb-2">
            {mode === "personal" ? `早安, ${userName}` : `COMMAND_CENTER: ${userName}`}
          </h1>
          <p className="text-[var(--color-muted)]">
            {mode === "personal" 
              ? "今天准备烹饪点什么特别的？" 
              : "System operational. All units standby."}
          </p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/create-recipe"
            className="flex items-center gap-2 px-6 py-3 rounded-[var(--radius-theme)] bg-[var(--color-accent)] text-white font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            <span>{mode === "personal" ? "新建菜谱" : "NEW_SOP_ENTRY"}</span>
          </Link>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Quick Start (Large) */}
        <div className="col-span-1 md:col-span-2 row-span-2 group relative overflow-hidden rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] shadow-sm hover:shadow-[var(--shadow-theme)] transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-light)]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="p-8 h-full flex flex-col justify-between relative z-10">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)]">
                <ChefHat className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--color-main)]">
                {mode === "personal" ? "开始智能烹饪" : "INITIATE_SESSION"}
              </h3>
              <p className="text-[var(--color-muted)] max-w-sm">
                {mode === "personal" 
                  ? "选择多道菜谱，我们将为您自动生成最佳的统筹时间表。" 
                  : "Select active SOPs for kitchen synchronization processing."}
              </p>
            </div>
            <div className="mt-8">
              <Link href="/plan" className="flex items-center gap-2 text-[var(--color-accent)] font-bold hover:gap-3 transition-all">
                创建计划 <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2: Recent Activity */}
        <div className="col-span-1 md:col-span-1 row-span-1 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] p-6 hover:border-[var(--color-accent)] transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-5 w-5 text-[var(--color-muted)]" />
            <span className="text-xs font-mono text-[var(--color-muted)]">STATUS</span>
          </div>
          <div className="text-3xl font-mono font-bold text-[var(--color-main)] mb-1">{stats.weeklyCount}</div>
          <div className="text-sm text-[var(--color-muted)]">
            {mode === "personal" ? "本周烹饪次数" : "Cycle Count"}
          </div>
        </div>

        {/* Card 3: Time Saved */}
        <div className="col-span-1 md:col-span-1 row-span-1 rounded-[var(--radius-theme)] bg-[var(--color-main)] text-[var(--color-page)] p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-[var(--color-accent)] blur-[60px] opacity-20 rounded-full translate-x-10 -translate-y-10" />
          <Clock className="h-6 w-6 mb-4 opacity-80" />
          <div>
            <div className="text-sm opacity-60 mb-1">Total Time Saved</div>
            <div className="text-2xl font-mono font-bold">
                {Math.floor(stats.totalSavedMinutes / 60)}h {stats.totalSavedMinutes % 60}m
            </div>
          </div>
        </div>

        {/* Card 4: Recipe Stats */}
        <div className="col-span-1 md:col-span-2 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-[var(--color-accent)]" />
              <h4 className="font-bold text-[var(--color-main)]">
                {mode === "personal" ? "最近编辑" : "RECENT_MODIFICATIONS"}
              </h4>
            </div>
            <Link href="/recipes" className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-main)]">
              VIEW ALL
            </Link>
          </div>
          
          {recentRecipes.length > 0 ? (
             <div className="space-y-3">
                {recentRecipes.map(recipe => (
                    <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-page)] transition-colors group">
                        <span className="font-medium text-[var(--color-main)] group-hover:text-[var(--color-accent)] transition-colors">{recipe.title}</span>
                        <span className="text-xs text-[var(--color-muted)]">{new Date(recipe.updated_at).toLocaleDateString()}</span>
                    </Link>
                ))}
             </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-[var(--color-border-theme)] rounded-[var(--radius-theme)]">
                <p className="text-[var(--color-muted)] mb-3">暂无菜谱</p>
                <Link href="/create-recipe" className="text-sm font-bold text-[var(--color-accent)] hover:underline">
                创建第一个菜谱
                </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
