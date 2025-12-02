"use client"

import Link from "next/link";
import { ArrowRight, Clock, Layers, Zap, ChefHat } from "lucide-react";
import { useMode } from "@/context/ModeContext";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const { mode } = useMode();

  return (
    <div className="min-h-screen transition-colors duration-700 relative overflow-hidden">
      {/* 动态背景层 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 transition-opacity duration-1000 opacity-100 data-[active=false]:opacity-0" data-active={mode === "personal"}>
          <div className="blob-bg w-full h-full" />
        </div>
        <div className="absolute inset-0 transition-opacity duration-1000 opacity-100 data-[active=false]:opacity-0" data-active={mode === "business"}>
          <div className="grid-bg w-full h-full" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-[var(--color-border-theme)] transition-all duration-700 glass-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <ChefHat className="h-8 w-8 text-[var(--color-accent)] transition-colors duration-700" />
              <span className="text-xl font-bold tracking-tight">ChefsManual</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--color-muted)]">
                <Link href="#" className="hover:text-[var(--color-main)] transition-colors">
                  {mode === "personal" ? "浏览菜谱" : "SOP 管理"}
                </Link>
                <Link href="#" className="hover:text-[var(--color-main)] transition-colors">
                  {mode === "personal" ? "我的厨房" : "设备监控"}
                </Link>
              </div>
              
              <div className="h-6 w-px bg-[var(--color-border-theme)] mx-2" />
              
              <ThemeToggle />
              
              <Link
                href="/login"
                className="ml-4 px-5 py-2 rounded-[var(--radius-theme)] bg-[var(--color-main)] text-[var(--color-page)] text-sm font-medium hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
              >
                {mode === "personal" ? "开始烹饪" : "进入控制台"}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* 徽章 */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] text-xs font-bold tracking-wide uppercase mb-8 border border-[var(--color-accent)]/20">
            <Zap className="h-3 w-3" />
            {mode === "personal" ? "重新定义家庭厨房" : "企业级厨房操作系统"}
          </div>
          
          {/* 主标题 */}
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-tight transition-all duration-700">
            {mode === "personal" ? (
              <>
                让烹饪变得 <br/>
                <span className="text-[var(--color-accent)]">简单而精确</span>
              </>
            ) : (
              <>
                KITCHEN <br/>
                <span className="text-[var(--color-accent)] font-mono tracking-tighter">OPERATING_SYSTEM</span>
              </>
            )}
          </h1>
          
          {/* 副标题 */}
          <p className="text-xl md:text-2xl text-[var(--color-muted)] mb-12 max-w-2xl mx-auto leading-relaxed transition-all duration-700">
            {mode === "personal" 
              ? "像跟着 GPS 开车一样做饭。实时语音计时、步骤自动拆解，让每一次下厨都完美复刻大厨风味。"
              : "将后厨流程数字化。通过标准化的 SOP 和智能调度算法，提升出餐效率，确保一致品质，降低人力成本。"
            }
          </p>
          
          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="px-8 py-4 rounded-[var(--radius-theme)] bg-[var(--color-accent)] text-white font-bold text-lg hover:opacity-90 transition-all hover:shadow-[var(--shadow-theme)] flex items-center gap-2">
              {mode === "personal" ? "免费注册" : "预约演示"} <ArrowRight className="h-5 w-5" />
            </button>
            <button className="px-8 py-4 rounded-[var(--radius-theme)] bg-[var(--color-card)] text-[var(--color-main)] border border-[var(--color-border-theme)] font-bold text-lg hover:bg-[var(--color-accent-light)] transition-all">
              {mode === "personal" ? "浏览热门菜谱" : "查看解决方案"}
            </button>
          </div>
        </div>

        {/* 模拟界面展示区 */}
        <div className="mt-24 max-w-6xl mx-auto relative">
          <div className="absolute inset-0 bg-[var(--color-accent)] blur-3xl opacity-20 rounded-full" />
          <div className="relative rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] bg-[var(--color-card)] p-4 shadow-2xl overflow-hidden transition-all duration-700">
            {/* 浏览器/App 顶部栏 */}
            <div className="flex items-center gap-2 mb-4 px-2 border-b border-[var(--color-border-theme)] pb-4">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
              <div className="ml-4 h-6 w-64 rounded-md bg-[var(--color-accent-light)]/30" />
            </div>
            
            {/* 内容区占位符 - 示意图 */}
            <div className="grid grid-cols-12 gap-6 p-4 h-[400px]">
              {/* 左侧导航 */}
              <div className="col-span-2 hidden md:block space-y-3">
                <div className="h-8 w-full rounded bg-[var(--color-accent-light)]/50" />
                <div className="h-8 w-3/4 rounded bg-[var(--color-border-theme)]/30" />
                <div className="h-8 w-4/5 rounded bg-[var(--color-border-theme)]/30" />
              </div>
              
              {/* 中间主内容 */}
              <div className="col-span-12 md:col-span-7 space-y-6">
                <div className="h-32 w-full rounded-[var(--radius-theme)] bg-[var(--color-border-theme)]/10 border border-[var(--color-border-theme)] p-6 relative overflow-hidden group">
                   <div className="absolute top-4 right-4 text-[var(--color-accent)] font-mono">03:45</div>
                   <div className="h-6 w-1/2 bg-[var(--color-main)]/10 rounded mb-4" />
                   <div className="h-4 w-3/4 bg-[var(--color-main)]/5 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="h-40 rounded-[var(--radius-theme)] bg-[var(--color-border-theme)]/10 border border-[var(--color-border-theme)]" />
                   <div className="h-40 rounded-[var(--radius-theme)] bg-[var(--color-border-theme)]/10 border border-[var(--color-border-theme)]" />
                </div>
              </div>
              
              {/* 右侧信息栏 */}
              <div className="col-span-3 hidden md:block rounded-[var(--radius-theme)] bg-[var(--color-border-theme)]/5 border border-[var(--color-border-theme)] p-4">
                 <div className="flex items-center gap-2 mb-4">
                   <Layers className="h-4 w-4 text-[var(--color-muted)]" />
                   <span className="text-xs font-mono text-[var(--color-muted)]">CURRENT_STEP</span>
                 </div>
                 <div className="space-y-2">
                   <div className="h-2 w-full bg-[var(--color-accent)] rounded-full" />
                   <div className="flex justify-between text-xs text-[var(--color-muted)] font-mono">
                     <span>Start</span>
                     <span>12m remaining</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
