import { Link } from "@/i18n/navigation";
import { ArrowRight, Clock, Layers, Zap, ChefHat, Play, CheckCircle2 } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LandingClient } from "./landing-client";
import { useTranslations } from "next-intl";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;
  const t = useTranslations('Landing');

  return (
    <LandingClient isLoggedIn={isLoggedIn}>
      {/* Hero Section Content passed as children or handled inside LandingClient */}
      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* 动态徽章 - 由 Client 组件控制内容 */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] text-xs font-bold tracking-wide uppercase mb-8 border border-[var(--color-accent)]/20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Zap className="h-3 w-3" />
          <span className="personal-text">{t('hero_badge_personal')}</span>
          <span className="business-text hidden">{t('hero_badge_business')}</span>
        </div>
        
        {/* 主标题 */}
        <h1 className="text-5xl md:text-8xl font-bold tracking-tight mb-8 leading-tight transition-all duration-700 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
          <span className="personal-text">
            {t('hero_title_start')} <br/>
            <span className="text-[var(--color-accent)]">{t('hero_title_highlight')}</span>
          </span>
          <span className="business-text hidden">
            KITCHEN <br/>
            <span className="text-[var(--color-accent)] font-mono tracking-tighter">{t('hero_title_business_sub')}</span>
          </span>
        </h1>
        
        {/* 副标题 */}
        <p className="text-xl md:text-2xl text-[var(--color-muted)] mb-12 max-w-2xl mx-auto leading-relaxed transition-all duration-700 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <span className="personal-text">
            {t('hero_desc_personal')}
          </span>
          <span className="business-text hidden">
            {t('hero_desc_business')}
          </span>
        </p>
        
        {/* 按钮组 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className="px-8 py-4 rounded-[var(--radius-theme)] bg-[var(--color-accent)] text-white font-bold text-lg hover:opacity-90 transition-all hover:shadow-[var(--shadow-theme)] hover:-translate-y-1 flex items-center gap-2"
          >
            {isLoggedIn ? t('nav_dashboard') : t('cta_start_free')} <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="#features"
            className="px-8 py-4 rounded-[var(--radius-theme)] bg-[var(--color-card)] text-[var(--color-main)] border border-[var(--color-border-theme)] font-bold text-lg hover:bg-[var(--color-accent-light)] transition-all flex items-center gap-2"
          >
            <Play className="h-4 w-4" /> {t('cta_learn_more')}
          </Link>
        </div>
      </div>
    </LandingClient>
  );
}
