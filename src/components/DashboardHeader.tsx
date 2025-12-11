"use client"

import { Link, useRouter, usePathname } from "@/i18n/navigation"
import { createClient } from "@/utils/supabase/client"
import { ChefHat, LogOut, Plus, User, Globe } from "lucide-react"
import { useMode } from "@/context/ModeContext"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useTranslations, useLocale } from "next-intl"

export function DashboardHeader({ userEmail }: { userEmail: string }) {
  const { mode } = useMode()
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const supabase = createClient()
  const t = useTranslations('Navigation')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const toggleLocale = () => {
    const newLocale = locale === 'zh' ? 'en' : 'zh'
    router.replace(pathname, { locale: newLocale })
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
            <Link href="/dashboard" className="hover:text-[var(--color-main)] transition-colors">{t('dashboard')}</Link>
            <Link href="/recipes" className="hover:text-[var(--color-main)] transition-colors">{t('my_recipes')}</Link>
            <Link href="/plan" className="hover:text-[var(--color-main)] transition-colors">{t('plan')}</Link>
            <Link href="/market" className="hover:text-[var(--color-main)] transition-colors">{t('market')}</Link>
          </nav>
        </div>

        {/* Actions Area */}
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLocale}
            className="p-2 rounded-full hover:bg-[var(--color-card)] transition-colors text-[var(--color-muted)] hover:text-[var(--color-main)]"
            title={locale === 'zh' ? 'Switch to English' : '切换到中文'}
          >
            <Globe className="h-5 w-5" />
            <span className="sr-only">Switch Language</span>
          </button>

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
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

