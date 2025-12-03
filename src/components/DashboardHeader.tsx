"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { ChefHat, LogOut, Plus, User } from "lucide-react"
import { useMode } from "@/context/ModeContext"
import { ThemeToggle } from "@/components/ThemeToggle"

export function DashboardHeader({ userEmail }: { userEmail: string }) {
  const { mode } = useMode()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border-theme)] glass-panel transition-all duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo Area */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <ChefHat className="h-6 w-6 text-[var(--color-accent)] transition-transform duration-500 group-hover:rotate-12" />
            <span className="text-lg font-bold tracking-tight text-[var(--color-main)]">
              ChefsManual
              {mode === "business" && <span className="text-xs ml-1 font-mono opacity-50">PRO</span>}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--color-muted)]">
            <Link href="/dashboard" className="hover:text-[var(--color-main)] transition-colors">概览</Link>
            <Link href="/recipes" className="hover:text-[var(--color-main)] transition-colors">我的菜谱</Link>
            <Link href="/session" className="hover:text-[var(--color-main)] transition-colors">开始烹饪</Link>
            <Link href="/market" className="hover:text-[var(--color-main)] transition-colors">商店</Link>
          </nav>
        </div>

        {/* Actions Area */}
        <div className="flex items-center gap-4">
          <Link 
            href="/create-recipe"
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-accent)] text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-[var(--color-accent)]/30"
          >
            <Plus className="h-4 w-4" />
            <span>新建菜谱</span>
          </Link>

          <div className="h-6 w-px bg-[var(--color-border-theme)] mx-2" />
          
          <ThemeToggle />

          <div className="relative group">
            <button className="flex items-center gap-2 p-1 rounded-full hover:bg-[var(--color-card)] transition-colors border border-transparent hover:border-[var(--color-border-theme)]">
              <div className="h-8 w-8 rounded-full bg-[var(--color-accent-light)] flex items-center justify-center text-[var(--color-accent)]">
                <User className="h-4 w-4" />
              </div>
            </button>
            
            {/* Dropdown */}
            <div className="absolute right-0 mt-2 w-48 rounded-[var(--radius-theme)] bg-[var(--color-card)] border border-[var(--color-border-theme)] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100">
              <div className="p-3 border-b border-[var(--color-border-theme)]">
                <p className="text-xs font-medium text-[var(--color-muted)] truncate">{userEmail}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

