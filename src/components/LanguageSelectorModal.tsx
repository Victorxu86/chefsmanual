"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "@/i18n/navigation"
import { ChefHat, Check } from "lucide-react"
import { useLocale } from "next-intl"

export function LanguageSelectorModal() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()

  useEffect(() => {
    // Check if user has explicitly selected a language before
    const hasSelected = localStorage.getItem("user_language_preference")
    if (!hasSelected) {
      // Small delay for smooth entrance
      const timer = setTimeout(() => setIsOpen(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleSelect = (locale: "zh" | "en") => {
    // 1. Save preference
    localStorage.setItem("user_language_preference", locale)
    
    // 2. Close modal
    setIsOpen(false)

    // 3. Navigate if different
    if (currentLocale !== locale) {
      router.replace(pathname, { locale })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 border border-white/10">
        
        {/* Header */}
        <div className="bg-[var(--color-accent)] p-6 text-white text-center">
          <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h2 className="text-2xl font-bold mb-1">Welcome to ChefsManual</h2>
          <p className="text-white/80 text-sm">Please select your preferred language</p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4">
          <button
            onClick={() => handleSelect("zh")}
            className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-transparent hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)]/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl">🇨🇳</div>
              <div className="text-left">
                <div className="font-bold text-lg text-[var(--color-main)]">中文 (简体)</div>
                <div className="text-xs text-[var(--color-muted)]">Chinese (Simplified)</div>
              </div>
            </div>
            {currentLocale === 'zh' && <Check className="w-6 h-6 text-[var(--color-accent)]" />}
          </button>

          <button
            onClick={() => handleSelect("en")}
            className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-transparent hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)]/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="text-2xl">🇺🇸</div>
              <div className="text-left">
                <div className="font-bold text-lg text-[var(--color-main)]">English</div>
                <div className="text-xs text-[var(--color-muted)]">International</div>
              </div>
            </div>
            {currentLocale === 'en' && <Check className="w-6 h-6 text-[var(--color-accent)]" />}
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border-theme)] text-center">
          <p className="text-xs text-[var(--color-muted)]">
            You can change this later in settings.
          </p>
        </div>
      </div>
    </div>
  )
}

