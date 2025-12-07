"use client"

import Link from "next/link"
import { useMode } from "@/context/ModeContext"
import { Plus, Clock, ChefHat, ArrowRight, Activity, Utensils, History, Sparkles } from "lucide-react"

interface Recipe {
  id: string
  title: string
  updated_at: string
  category?: string
  total_time_minutes?: number
}

interface SessionActivity {
  id: string
  created_at: string
  total_duration_seconds: number
  recipe_count: number
  recipe_titles: string[]
}

interface DashboardContentProps {
  userName: string
  stats: {
    weeklyCount: number
    totalSavedMinutes: number
  }
  recentRecipes: Recipe[]
  recentActivity: SessionActivity[]
  recommendations: Recipe[]
}

export function DashboardContent({ userName, stats, recentRecipes, recentActivity, recommendations }: DashboardContentProps) {
  const { mode } = useMode()

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
              <Link href="/session" className="flex items-center gap-2 text-[var(--color-accent)] font-bold hover:gap-3 transition-all">
                选择菜谱 <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2: Weekly Activity */}
        <div className="col-span-1 md:col-span-1 row-span-1 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] p-6 hover:border-[var(--color-accent)] transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-5 w-5 text-[var(--color-muted)]" />
            <span className="text-xs font-mono text-[var(--color-muted)]">WEEKLY_STATS</span>
          </div>
          <div className="text-3xl font-mono font-bold text-[var(--color-main)] mb-1">{stats.weeklyCount}</div>
          <div className="text-sm text-[var(--color-muted)]">
            {mode === "personal" ? "本周烹饪完成" : "Completed Cycles"}
          </div>
        </div>

        {/* Card 3: Time Saved */}
        <div className="col-span-1 md:col-span-1 row-span-1 rounded-[var(--radius-theme)] bg-[var(--color-main)] text-[var(--color-page)] p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-[var(--color-accent)] blur-[60px] opacity-20 rounded-full translate-x-10 -translate-y-10" />
          <Clock className="h-6 w-6 mb-4 opacity-80" />
          <div>
            <div className="text-sm opacity-60 mb-1">{mode === "personal" ? "累计节省时间" : "TOTAL_TIME_SAVED"}</div>
            <div className="text-2xl font-mono font-bold">
                {Math.floor(stats.totalSavedMinutes / 60)}h {stats.totalSavedMinutes % 60}m
            </div>
          </div>
        </div>

        {/* Card 4: Recent Recipes & Actions */}
        <div className="col-span-1 md:col-span-2 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-[var(--color-accent)]" />
              <h4 className="font-bold text-[var(--color-main)]">
                {mode === "personal" ? "我的菜谱" : "SOP_DATABASE"}
              </h4>
            </div>
            <Link href="/recipes" className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-main)]">
              VIEW ALL
            </Link>
          </div>
          
          <div className="flex-1 space-y-3 mb-6">
            {recentRecipes.length > 0 ? (
                recentRecipes.map(recipe => (
                    <Link key={recipe.id} href={`/recipes/${recipe.id}/edit`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--color-page)] transition-colors group">
                        <span className="font-medium text-[var(--color-main)] group-hover:text-[var(--color-accent)] transition-colors">{recipe.title}</span>
                        <span className="text-xs text-[var(--color-muted)]">{new Date(recipe.updated_at).toLocaleDateString()}</span>
                    </Link>
                ))
            ) : (
                <div className="text-center py-4 text-[var(--color-muted)]">暂无菜谱</div>
            )}
          </div>

          <Link 
            href="/create-recipe" 
            className="w-full py-2.5 rounded-[var(--radius-theme)] border-2 border-dashed border-[var(--color-border-theme)] text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] font-bold flex items-center justify-center gap-2 transition-all group"
          >
              <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
              {mode === "personal" ? "新建菜谱" : "CREATE_NEW_ENTRY"}
          </Link>
        </div>

        {/* Card 5: Menu Generator (NEW CARD) */}
        <div className="col-span-1 md:col-span-1 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] p-6 relative overflow-hidden group hover:border-[var(--color-accent)] transition-colors">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                    <Sparkles className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-[var(--color-main)]">
                    {mode === "personal" ? "菜单生成器" : "MENU_ASSET_GEN"}
                </h4>
            </div>
            
            <p className="text-sm text-[var(--color-muted)] mb-6 min-h-[40px]">
                {mode === "personal" ? "为您的晚宴定制专属精美菜单图片。" : "Generate printable menu assets for distribution."}
            </p>

            <Link 
                href="/menu-generator"
                className="w-full py-2 rounded-[var(--radius-theme)] bg-[var(--color-main)] text-[var(--color-page)] text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
                去生成
                <ArrowRight className="h-3 w-3" />
            </Link>
        </div>

        {/* Card 5: Recent Sessions (History) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[var(--color-muted)]" />
              <h4 className="font-bold text-[var(--color-main)]">
                {mode === "personal" ? "烹饪历史" : "SESSION_LOGS"}
              </h4>
            </div>
          </div>

          {recentActivity.length > 0 ? (
             <div className="space-y-3">
                {recentActivity.map(session => (
                    <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-page)]/50 border border-[var(--color-border-theme)]/50">
                        <div>
                            <div className="font-medium text-[var(--color-main)] text-sm line-clamp-1">
                                {session.recipe_titles.join(", ")}
                                {session.recipe_count > 2 && ` +${session.recipe_count - 2}`}
                            </div>
                            <div className="text-xs text-[var(--color-muted)] mt-1">
                                {new Date(session.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        <Link href={`/session/complete?session_id=${session.id}`} className="p-2 rounded-full hover:bg-[var(--color-accent)]/10 text-[var(--color-accent)] transition-colors">
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                ))}
             </div>
          ) : (
            <div className="text-center py-4 text-[var(--color-muted)] text-sm">
                暂无记录
            </div>
          )}
        </div>

        {/* Card 6: Smart Recommendations (NEW) */}
        <div className="col-span-1 md:col-span-3 lg:col-span-1 rounded-[var(--radius-theme)] bg-gradient-to-br from-[var(--color-card)] to-[var(--color-accent-light)]/10 border border-[var(--color-border-theme)] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)]/5 rounded-full blur-2xl -translate-y-10 translate-x-10" />
          
          <div className="flex items-center gap-2 mb-6 relative z-10">
            <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
            <h4 className="font-bold text-[var(--color-main)]">
              {mode === "personal" ? "推荐组合" : "OPTIMIZED_SET"}
            </h4>
          </div>

          {recommendations.length >= 2 ? (
            <div className="relative z-10">
              <div className="flex -space-x-3 mb-4 overflow-hidden py-1 pl-1">
                 {recommendations.map((r, i) => (
                    <div key={r.id} className="relative w-10 h-10 rounded-full bg-[var(--color-page)] border-2 border-[var(--color-card)] flex items-center justify-center text-xs font-bold text-[var(--color-main)] shadow-sm shrink-0" title={r.title}>
                        {r.title.charAt(0)}
                    </div>
                 ))}
              </div>
              <p className="text-sm font-medium text-[var(--color-main)] mb-1">
                {recommendations.map(r => r.title).join(" + ")}
              </p>
              <p className="text-xs text-[var(--color-muted)] mb-4">
                 预计耗时: {Math.max(...recommendations.map(r => r.total_time_minutes || 30))} 分钟 (并行后)
              </p>
              
              <Link 
                href={`/session?recipes=${recommendations.map(r => r.id).join(',')}`}
                className="w-full py-2 rounded-[var(--radius-theme)] bg-[var(--color-main)] text-[var(--color-page)] text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                一键开始
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
             <div className="text-sm text-[var(--color-muted)] py-4 relative z-10">
                创建更多不同种类的菜谱 (主食、汤、凉菜)，解锁智能组合推荐。
             </div>
          )}
        </div>

      </div>
    </div>
  )
}
