"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

type Mode = "personal" | "business"

interface ModeContextType {
  mode: Mode
  toggleMode: () => void
  setMode: (mode: Mode) => void
}

const ModeContext = createContext<ModeContextType | undefined>(undefined)

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("personal")

  useEffect(() => {
    // 初始化时设置 data-mode
    document.documentElement.setAttribute("data-mode", mode)
  }, [mode])

  const toggleMode = () => {
    setMode((prev) => (prev === "personal" ? "business" : "personal"))
  }

  return (
    <ModeContext.Provider value={{ mode, toggleMode, setMode }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  const context = useContext(ModeContext)
  if (context === undefined) {
    throw new Error("useMode must be used within a ModeProvider")
  }
  return context
}

