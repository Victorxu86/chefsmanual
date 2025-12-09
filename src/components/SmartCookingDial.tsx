"use client"

import { useState, useEffect, useRef } from "react"
import { Check, Lock, Play, Pause, ChevronRight, Plus, RotateCcw, Flame, Clock } from "lucide-react"

interface SmartCookingDialProps {
  duration: number
  elapsed: number // Task specific elapsed time
  type: 'prep' | 'cook' | 'wait' | 'serve'
  isLocked: boolean
  onComplete: () => void
  onAddOneMinute: () => void
  onCancelComplete?: () => void // If auto-completing, ability to cancel
  size?: number
  instruction?: string // NEW: Instruction text to display inside
}

export function SmartCookingDial({
  duration,
  elapsed,
  type,
  isLocked,
  onComplete,
  onAddOneMinute,
  size = 280, // Default size if not provided
  instruction
}: SmartCookingDialProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [longPressProgress, setLongPressProgress] = useState(0)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  // Calculate progress
  // Ensure we don't divide by zero and cap at 100%
  const progress = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 100
  const isFinished = elapsed >= duration

  // Long press logic
  const handleMouseDown = () => {
    if (isLocked) return
    
    // Start filling long press ring
    let start = Date.now()
    const checkPress = () => {
      const diff = Date.now() - start
      // Long press duration: 800ms
      const pressPercentage = Math.min(100, (diff / 800) * 100)
      setLongPressProgress(pressPercentage)
      
      if (diff >= 800) {
        onComplete()
        setLongPressProgress(0)
      } else {
        animationFrameRef.current = requestAnimationFrame(checkPress)
      }
    }
    animationFrameRef.current = requestAnimationFrame(checkPress)
  }

  const handleMouseUp = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    setLongPressProgress(0)
  }

  // Auto-advance logic for 'cook' tasks
  // Note: We don't auto-call onComplete here directly to keep control in parent, 
  // but the UI suggests it's "Done"
  
  // Color mapping
  const colors = {
    prep: "text-green-500 stroke-green-500",
    cook: "text-orange-500 stroke-orange-500",
    wait: "text-blue-500 stroke-blue-500",
    serve: "text-purple-500 stroke-purple-500",
    locked: "text-gray-300 stroke-gray-300"
  }
  
  const currentColor = isLocked ? colors.locked : colors[type] || colors.cook
  
  // SVG Math
  const strokeWidth = size * 0.04 // Relative stroke width
  const center = size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  const strokeDashoffset = circumference - (progress / 100) * circumference
  const longPressOffset = circumference - (longPressProgress / 100) * circumference

  return (
    <div className="flex flex-col items-center gap-6 select-none relative w-full h-full flex items-center justify-center">
        
        {/* Main Dial */}
        <div 
            className="relative cursor-pointer transition-transform active:scale-95 touch-none max-w-full max-h-full aspect-square flex-shrink-0"
            style={{ width: size, height: size }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            onMouseEnter={() => setIsHovering(true)}
        >
            {/* Background Track */}
            <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-[var(--color-border-theme)] opacity-30"
                />
                
                {/* Progress Arc */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`transition-all duration-500 ease-linear ${currentColor}`}
                />

                {/* Long Press Overlay (White/Accent) */}
                {longPressProgress > 0 && (
                    <circle
                        cx={center}
                        cy={center}
                        r={radius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={longPressOffset}
                        strokeLinecap="round"
                        className="text-[var(--color-main)] opacity-50"
                    />
                )}
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-12 text-center">
                {isLocked ? (
                    <div className="flex flex-col items-center gap-4 text-[var(--color-muted)] animate-pulse">
                        <Lock className="h-16 w-16" />
                        <span className="text-xl font-bold uppercase tracking-widest">Locked</span>
                    </div>
                ) : isFinished ? (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <Check className={`h-24 w-24 ${type === 'cook' ? 'text-orange-500' : 'text-green-500'}`} />
                        <span className="text-lg font-bold text-[var(--color-muted)] mt-4">点击或长按完成</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center w-full">
                        {/* Instruction Text (NEW) */}
                        {instruction && (
                            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-main)] leading-tight mb-4 line-clamp-3 w-full break-words">
                                {instruction}
                            </h2>
                        )}

                        {/* Remaining Time */}
                        <span className={`text-6xl md:text-8xl font-mono font-bold tracking-tighter ${isLocked ? 'text-gray-300' : 'text-[var(--color-main)]'}`}>
                            {(() => {
                                const remaining = Math.max(0, Math.ceil(duration - elapsed))
                                const m = Math.floor(remaining / 60)
                                const s = remaining % 60
                                return `${m}:${s.toString().padStart(2, '0')}`
                            })()}
                        </span>
                        
                        {/* Context Hint */}
                        <div className="mt-4 text-sm font-bold uppercase tracking-widest text-[var(--color-muted)] flex items-center gap-2 opacity-70">
                            {longPressProgress > 0 ? (
                                <span>释放取消</span>
                            ) : (
                                <>
                                    {type === 'cook' && <Flame className="h-4 w-4" />}
                                    {type === 'prep' && <Check className="h-4 w-4" />}
                                    {type === 'wait' && <Clock className="h-4 w-4" />}
                                    <span>长按跳过</span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Action Buttons (Appears when finished or nearly finished) */}
        <div className={`absolute bottom-0 translate-y-24 flex items-center gap-12 transition-opacity duration-500 ${isFinished || isLocked ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Add Time Button */}
            {!isLocked && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onAddOneMinute()
                    }}
                    className="flex flex-col items-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-main)] transition-colors group"
                >
                    <div className="w-16 h-16 rounded-full border border-[var(--color-border-theme)] flex items-center justify-center bg-[var(--color-page)] group-hover:border-[var(--color-accent)] group-hover:bg-white shadow-sm">
                        <Plus className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold">+1 分钟</span>
                </button>
            )}

            {/* Explicit Done Button (Alternative to dial click) */}
            {!isLocked && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onComplete()
                    }}
                    className="flex flex-col items-center gap-2 text-[var(--color-accent)] hover:scale-105 transition-transform"
                >
                    <div className="w-20 h-20 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--color-accent)]/30">
                        <ChevronRight className="h-10 w-10 ml-0.5" />
                    </div>
                    <span className="text-xs font-bold">下一步</span>
                </button>
            )}
        </div>
        
    </div>
  )
}
