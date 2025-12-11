"use client"

import React, { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { ChefHat, Layers, Clock, Utensils, ArrowRight, Activity, LayoutDashboard, ShoppingBag, Calendar } from "lucide-react";
import { useMode } from "@/context/ModeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslations } from "next-intl";

export function LandingClient({ 
  isLoggedIn, 
  children 
}: { 
  isLoggedIn: boolean, 
  children: React.ReactNode 
}) {
  const { mode } = useMode();
  const t = useTranslations('Landing');

  return (
    <div className="min-h-screen transition-colors duration-700 relative overflow-hidden bg-[var(--color-page)] text-[var(--color-main)]">
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
                <Link href="#features" className="hover:text-[var(--color-main)] transition-colors">{t('nav_features')}</Link>
                <Link href="#pricing" className="hover:text-[var(--color-main)] transition-colors">{t('nav_pricing')}</Link>
              </div>
              
              <div className="h-6 w-px bg-[var(--color-border-theme)] mx-2" />
              
              <ThemeToggle />
              
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="ml-4 px-5 py-2 rounded-[var(--radius-theme)] bg-[var(--color-main)] text-[var(--color-page)] text-sm font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                >
                  {t('nav_dashboard')}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="ml-4 px-5 py-2 rounded-[var(--radius-theme)] bg-[var(--color-main)] text-[var(--color-page)] text-sm font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
                >
                  {t('nav_login')}
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section (Passed from Server Component) */}
      <section className="relative pt-24 pb-32 px-4 z-10">
        {/* 这里使用 CSS 类名来控制 Personal/Business 文本的显示隐藏 */}
        <style jsx global>{`
          [data-mode="personal"] .business-text { display: none; }
          [data-mode="personal"] .personal-text { display: inline; }
          [data-mode="business"] .personal-text { display: none; }
          [data-mode="business"] .business-text { display: inline; }
        `}</style>
        {children}

        {/* 模拟界面展示区 - 双模态 */}
        <div className="mt-24 max-w-6xl mx-auto relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="absolute inset-0 bg-[var(--color-accent)] blur-[100px] opacity-20 rounded-full" />
          
          <div className="relative rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] bg-[var(--color-card)] p-4 shadow-2xl overflow-hidden transition-all duration-700 hover:scale-[1.01] hover:shadow-[var(--shadow-theme)]">
            {/* 浏览器/App 顶部栏 */}
            <div className="flex items-center gap-2 mb-4 px-2 border-b border-[var(--color-border-theme)] pb-4">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
              <div className="ml-4 h-6 w-64 rounded-md bg-[var(--color-accent-light)]/30 flex items-center px-3">
                <span className="text-[10px] font-mono text-[var(--color-muted)]">chefsmanual.com/dashboard</span>
              </div>
            </div>
            
            {/* 界面内容 - 动态切换 */}
            <div className="grid grid-cols-12 gap-6 p-4 h-[400px]">
              {/* 左侧导航 */}
              <div className="col-span-2 hidden md:flex flex-col gap-2">
                {[LayoutDashboard, Utensils, Calendar, ShoppingBag].map((Icon, i) => (
                  <div key={i} className={`h-10 w-full rounded-[var(--radius-theme)] flex items-center gap-3 px-3 transition-colors ${i===0 ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]' : 'text-[var(--color-muted)] hover:bg-[var(--color-page)]'}`}>
                    <Icon className="h-4 w-4" />
                    <div className="h-2 w-12 rounded bg-current opacity-20" />
                  </div>
                ))}
              </div>
              
              {/* 中间主内容 */}
              <div className="col-span-12 md:col-span-7 space-y-6">
                {/* 卡片 1: 正在进行 */}
                <div className="h-32 w-full rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] p-6 relative overflow-hidden group">
                   <div className="absolute top-4 right-4 text-[var(--color-accent)] font-mono font-bold text-xl">03:45</div>
                   <div className="flex items-center gap-3 mb-4">
                     <div className="h-8 w-8 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center">
                       <Activity className="h-4 w-4" />
                     </div>
                     <div>
                       <div className="h-4 w-32 bg-[var(--color-main)] rounded mb-1 opacity-80" />
                       <div className="h-3 w-20 bg-[var(--color-muted)] rounded opacity-50" />
                     </div>
                   </div>
                   {/* 进度条 */}
                   <div className="w-full h-2 bg-[var(--color-border-theme)] rounded-full overflow-hidden">
                     <div className="h-full w-[60%] bg-[var(--color-accent)]" />
                   </div>
                </div>
                
                {/* 卡片 2: 列表 */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="h-40 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] p-4 flex flex-col justify-between">
                      <div className="h-8 w-8 rounded bg-green-100 text-green-600 flex items-center justify-center">
                        <Utensils className="h-4 w-4" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-24 bg-[var(--color-main)] rounded opacity-60" />
                        <div className="h-3 w-16 bg-[var(--color-main)] rounded opacity-40" />
                      </div>
                   </div>
                   <div className="h-40 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] p-4 flex flex-col justify-between">
                      <div className="h-8 w-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-24 bg-[var(--color-main)] rounded opacity-60" />
                        <div className="h-3 w-16 bg-[var(--color-main)] rounded opacity-40" />
                      </div>
                   </div>
                </div>
              </div>
              
              {/* 右侧信息栏 */}
              <div className="col-span-3 hidden md:block rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] p-4">
                 <div className="flex items-center gap-2 mb-4">
                   <Layers className="h-4 w-4 text-[var(--color-muted)]" />
                   <span className="text-xs font-mono text-[var(--color-muted)]">NEXT_STEPS</span>
                 </div>
                 <div className="space-y-4">
                   {[1,2,3,4].map(i => (
                     <div key={i} className="flex gap-3 items-start">
                       <div className="w-2 h-2 rounded-full bg-[var(--color-border-theme)] mt-1.5" />
                       <div className="flex-1 space-y-1">
                         <div className="h-3 w-full bg-[var(--color-main)] rounded opacity-40" />
                         <div className="h-2 w-2/3 bg-[var(--color-main)] rounded opacity-20" />
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props Grid (Personal Mode) */}
      <section id="features" className="py-24 bg-[var(--color-card)] transition-colors duration-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4 text-[var(--color-main)]">
              <span className="personal-text">{t('features_title_personal')}</span>
              <span className="business-text hidden">{t('features_title_business')}</span>
            </h2>
            <p className="text-[var(--color-muted)]">
              <span className="personal-text">{t('features_subtitle_personal')}</span>
              <span className="business-text hidden">{t('features_subtitle_business')}</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Layers className="h-8 w-8 text-blue-600" />}
              title={t('feature_1_title')}
              titleBusiness={t('feature_1_business')}
              description={t('feature_1_desc')}
              descriptionBusiness={t('feature_1_desc_business')}
            />
            <FeatureCard 
              icon={<Clock className="h-8 w-8 text-orange-600" />}
              title={t('feature_2_title')}
              titleBusiness={t('feature_2_business')}
              description={t('feature_2_desc')}
              descriptionBusiness={t('feature_2_desc_business')}
            />
            <FeatureCard 
              icon={<ChefHat className="h-8 w-8 text-stone-800 dark:text-white" />}
              title={t('feature_3_title')}
              titleBusiness={t('feature_3_business')}
              description={t('feature_3_desc')}
              descriptionBusiness={t('feature_3_desc_business')}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border-theme)] py-12 bg-[var(--color-page)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-[var(--color-muted)]" />
            <span className="font-bold text-[var(--color-main)]">ChefsManual</span>
          </div>
          <p className="text-sm text-[var(--color-muted)]">© {new Date().getFullYear()} ChefsManual Inc.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  titleBusiness, 
  description, 
  descriptionBusiness 
}: { 
  icon: React.ReactNode, 
  title: string, 
  titleBusiness: string, 
  description: string, 
  descriptionBusiness: string 
}) {
  return (
    <div className="flex flex-col items-start group p-6 rounded-[var(--radius-theme)] hover:bg-[var(--color-page)] transition-all duration-300">
      <div className="mb-4 p-3 bg-[var(--color-accent-light)]/30 rounded-2xl border border-[var(--color-accent)]/10 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[var(--color-main)] mb-3">
        <span className="personal-text">{title}</span>
        <span className="business-text hidden">{titleBusiness}</span>
      </h3>
      <p className="text-[var(--color-muted)] leading-relaxed">
        <span className="personal-text">{description}</span>
        <span className="business-text hidden">{descriptionBusiness}</span>
      </p>
    </div>
  );
}

