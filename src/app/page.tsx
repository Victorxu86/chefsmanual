import Link from "next/link";
import { ArrowRight, ChefHat, Clock, Layers, Utensils, Zap, Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Navigation */}
      <nav className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <span className="text-xl font-bold tracking-tight text-stone-900">ChefsManual</span>
            </div>
            <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-stone-600">
              <Link href="#features" className="hover:text-orange-600 transition-colors">功能</Link>
              <Link href="#for-home" className="hover:text-orange-600 transition-colors">家庭版</Link>
              <Link href="#for-business" className="hover:text-orange-600 transition-colors">专业版</Link>
              <Link href="/market" className="hover:text-orange-600 transition-colors">菜谱商店</Link>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-stone-600 hover:text-stone-900">
                登录
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-full bg-stone-900 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                开始烹饪
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold tracking-wide uppercase mb-8">
              <Zap className="h-3 w-3" />
              重新定义厨房工作流
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-stone-900 mb-8 leading-tight">
              厨房里的 <span className="text-orange-600 relative whitespace-nowrap">
                智能导航
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-orange-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                </svg>
              </span>
            </h1>
            <p className="text-xl text-stone-600 mb-12 leading-relaxed">
              将烹饪拆解为精确的工程步骤。无论是家庭晚餐还是餐厅后厨，
              ChefsManual 提供实时计时、多菜调度与 SOP 标准化指导。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="px-8 py-4 rounded-full bg-orange-600 text-white font-bold text-lg hover:bg-orange-700 transition-all hover:shadow-lg hover:shadow-orange-200 flex items-center gap-2"
              >
                免费开始使用 <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#demo"
                className="px-8 py-4 rounded-full bg-white text-stone-900 font-bold text-lg border border-stone-200 hover:border-stone-400 transition-all"
              >
                查看演示
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10 opacity-40 pointer-events-none">
           <div className="absolute top-[20%] left-[10%] w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
           <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
           <div className="absolute -bottom-8 left-[20%] w-72 h-72 bg-stone-200 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Value Props Grid */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Layers className="h-8 w-8 text-blue-600" />}
              title="结构化菜谱"
              description="告别模糊的“少许”和“适量”。我们将每道菜拆解为带有精确时间、温度和设备需求的数据流。"
            />
            <FeatureCard 
              icon={<Clock className="h-8 w-8 text-orange-600" />}
              title="智能并行调度"
              description="做三菜一汤不再手忙脚乱。系统自动计算最佳统筹路径，告诉你何时切菜、何时下锅，多线程完美同步。"
            />
            <FeatureCard 
              icon={<Settings className="h-8 w-8 text-stone-800" />}
              title="SOP 标准化管理"
              description="面向专业厨房。创建标准操作程序(SOP)，确保每一位厨师都能产出一致的风味，降低培训成本。"
            />
          </div>
        </div>
      </section>

      {/* To C & To B Split */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* To C */}
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-stone-100">
              <div className="inline-block p-3 bg-green-100 rounded-xl mb-6">
                <Utensils className="h-8 w-8 text-green-700" />
              </div>
              <h3 className="text-2xl font-bold text-stone-900 mb-4">家庭烹饪者</h3>
              <p className="text-stone-600 mb-8">
                想要在家复刻餐厅级美味？ChefsManual 是你的私人副厨。
                选好今天的菜单，我们将为你生成一份精确到秒的执行清单。
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-stone-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 实时语音计时提醒
                </li>
                <li className="flex items-center gap-2 text-stone-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 自动生成采购清单
                </li>
                <li className="flex items-center gap-2 text-stone-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> 探索并购买名厨配方
                </li>
              </ul>
              <Link href="/signup?role=user" className="text-green-700 font-bold hover:underline">
                免费开始 &rarr;
              </Link>
            </div>

            {/* To B */}
            <div className="bg-stone-900 rounded-2xl p-8 md:p-12 shadow-xl text-white">
              <div className="inline-block p-3 bg-stone-800 rounded-xl mb-6">
                <ChefHat className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">餐厅与酒店</h3>
              <p className="text-stone-400 mb-8">
                让厨房管理从“人治”走向“法治”。
                建立云端配方库，实时监控出餐流程，优化设备与人力资源。
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-stone-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> 企业级 SOP 编辑器
                </li>
                <li className="flex items-center gap-2 text-stone-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> 厨房可视化运营看板
                </li>
                <li className="flex items-center gap-2 text-stone-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" /> 员工培训与考核系统
                </li>
              </ul>
              <Link href="/business" className="text-orange-500 font-bold hover:underline">
                咨询企业版 &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-stone-500">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ChefHat className="h-6 w-6 text-stone-400" />
            <span className="font-bold text-stone-700">ChefsManual</span>
          </div>
          <p>© {new Date().getFullYear()} ChefsManual. 让烹饪成为一门精确的艺术。</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-start">
      <div className="mb-4 p-3 bg-stone-50 rounded-2xl border border-stone-100">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-stone-900 mb-3">{title}</h3>
      <p className="text-stone-600 leading-relaxed">{description}</p>
    </div>
  );
}
