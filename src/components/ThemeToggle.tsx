"use client"

import { useMode } from "@/context/ModeContext"
import { Utensils, ChefHat } from "lucide-react"

export function ThemeToggle() {
  const { mode, toggleMode } = useMode()

  return (
    <button
      onClick={toggleMode}
      className="relative h-10 w-20 rounded-full bg-stone-200 p-1 transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-black data-[mode=business]:bg-zinc-800"
      data-mode={mode}
      aria-label="Toggle theme"
    >
      {/* 滑块背景 */}
      <div className="absolute inset-1 flex justify-between items-center px-2">
        <Utensils className="h-4 w-4 text-stone-500 transition-colors duration-500 data-[active=true]:text-stone-900" data-active={mode === "personal"} />
        <ChefHat className="h-4 w-4 text-zinc-500 transition-colors duration-500 data-[active=true]:text-white" data-active={mode === "business"} />
      </div>

      {/* 滑块本身 */}
      <div
        className={`
          absolute top-1 left-1 h-8 w-9 rounded-full shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          flex items-center justify-center
          ${mode === "personal" ? "translate-x-0 bg-white" : "translate-x-10 bg-zinc-900 border border-zinc-700"}
        `}
      >
        {mode === "personal" ? (
          <Utensils className="h-4 w-4 text-orange-600" />
        ) : (
          <ChefHat className="h-4 w-4 text-white" />
        )}
      </div>
    </button>
  )
}

