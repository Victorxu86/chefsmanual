"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChefHat, Utensils, ArrowLeft, AlertCircle } from "lucide-react"
import { login, signup } from "./actions"
import { useMode } from "@/context/ModeContext"

export default function LoginPage() {
  const { mode } = useMode()
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const message = searchParams.get("message")

  const handleSubmit = () => {
    setLoading(true)
    // Form submission is handled by Server Actions, this is just for UI feedback
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors duration-700">
      {/* Backgrounds */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 transition-opacity duration-1000 opacity-100 data-[active=false]:opacity-0" data-active={mode === "personal"}>
          <div className="blob-bg w-full h-full" />
        </div>
        <div className="absolute inset-0 transition-opacity duration-1000 opacity-100 data-[active=false]:opacity-0" data-active={mode === "business"}>
          <div className="grid-bg w-full h-full" />
        </div>
      </div>

      {/* Back Button */}
      <div className="absolute top-8 left-8 z-20">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-[var(--color-muted)] hover:text-[var(--color-main)] transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          {mode === "personal" ? "返回首页" : "EXIT_TERMINAL"}
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="glass-panel rounded-[var(--radius-theme)] p-8 shadow-2xl transition-all duration-700">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                {mode === "personal" ? <Utensils className="h-8 w-8" /> : <ChefHat className="h-8 w-8" />}
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight text-[var(--color-main)]">
              {isSignUp ? (mode === "personal" ? "加入厨房" : "INITIALIZE_USER") : (mode === "personal" ? "欢迎回来" : "ACCESS_CONTROL")}
            </h1>
            <p className="text-[var(--color-muted)] text-sm">
              {mode === "personal" 
                ? "登录以同步您的菜谱和计划" 
                : "Authentication required for system access."}
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 p-3 rounded-[var(--radius-theme)] bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          {message && (
            <div className="mb-6 p-3 rounded-[var(--radius-theme)] bg-green-50 border border-green-200 text-green-600 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {message}
            </div>
          )}

          {/* Form */}
          <form action={isSignUp ? signup : login} onSubmit={handleSubmit} className="space-y-4">
            
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-main)] mb-1.5">
                  {mode === "personal" ? "全名" : "IDENTITY_ID"}
                </label>
                <input
                  name="fullName"
                  type="text"
                  required
                  placeholder={mode === "personal" ? "Gordon Ramsay" : "CHEF_001"}
                  className="w-full px-4 py-2.5 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-[var(--color-main)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--color-main)] mb-1.5">
                {mode === "personal" ? "邮箱地址" : "EMAIL_PROTOCOL"}
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="chef@example.com"
                className="w-full px-4 py-2.5 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-[var(--color-main)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-main)] mb-1.5">
                {mode === "personal" ? "密码" : "ACCESS_KEY"}
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] text-[var(--color-main)] placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 rounded-[var(--radius-theme)] bg-[var(--color-accent)] text-white font-bold hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isSignUp ? (mode === "personal" ? "注册账号" : "REGISTER_UNIT") : (mode === "personal" ? "立即登录" : "EXECUTE_LOGIN")
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)] transition-colors font-medium"
            >
              {isSignUp 
                ? (mode === "personal" ? "已有账号？去登录" : "Have ID? ACCESS_SYSTEM") 
                : (mode === "personal" ? "没有账号？免费注册" : "No ID? INITIALIZE_NEW_UNIT")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

