"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Download, ChefHat, Utensils, X, Image as ImageIcon } from "lucide-react"
import { useMode } from "@/context/ModeContext"

interface Recipe {
  id: string
  title: string
  category?: string
  cuisine?: string
}

interface MenuGeneratorClientProps {
  recipes: Recipe[]
  userName: string
}

export function MenuGeneratorClient({ recipes, userName }: MenuGeneratorClientProps) {
  const { mode } = useMode()
  const router = useRouter()
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([])
  const [menuTitle, setMenuTitle] = useState("今日菜单")
  const [guestName, setGuestName] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  const toggleRecipe = (recipe: Recipe) => {
    setSelectedRecipes(prev => 
      prev.find(r => r.id === recipe.id)
        ? prev.filter(r => r.id !== recipe.id)
        : [...prev, recipe]
    )
  }

  const handleDownload = async () => {
    if (!previewRef.current) return
    setIsGenerating(true)

    try {
      // Robust dynamic import with fallback
      const module = await import('html2canvas')
      const html2canvas = module.default || module

      // Wait a bit for fonts to load
      await document.fonts.ready
      
      const canvas = await html2canvas(previewRef.current, {
        scale: 2, // High resolution
        backgroundColor: mode === 'business' ? '#000000' : '#ffffff',
        useCORS: true,
        allowTaint: true,
          logging: true, // Enable logging to see errors in console
          onclone: (clonedDoc) => {
             // Fix vertical offset in html2canvas by manually adjusting the text position
             const brandText = clonedDoc.getElementById('menu-brand-text')
             if (brandText) {
                 brandText.style.position = 'relative'
                 brandText.style.top = '-2px' // Pull text up to correct canvas rendering offset
             }
          }
        })

      const link = document.createElement('a')
      link.download = `chefsmanual-menu-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err: any) {
      console.error("Failed to generate image:", err)
      alert(`生成图片失败: ${err.message || "未知错误"}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-[var(--color-card)] transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-[var(--color-muted)]" />
        </button>
        <div>
           <h1 className="text-2xl font-bold text-[var(--color-main)]">
             {mode === "personal" ? "生成菜单" : "GENERATE_MENU_ASSET"}
           </h1>
           <p className="text-[var(--color-muted)] text-sm">
             选择菜品，为您的客人定制专属菜单
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left: Configuration */}
        <div className="space-y-8">
           
           {/* 1. Basic Info */}
           <div className="glass-panel p-6 rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] space-y-4">
              <h3 className="font-bold text-[var(--color-main)] flex items-center gap-2">
                 <ChefHat className="h-5 w-5 text-[var(--color-accent)]" />
                 基本信息
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">菜单标题</label>
                    <input 
                      type="text" 
                      value={menuTitle}
                      onChange={(e) => setMenuTitle(e.target.value)}
                      className="w-full px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] focus:border-[var(--color-accent)] outline-none transition-all text-[var(--color-main)]"
                      placeholder="例如：周末家宴"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">致辞对象 (可选)</label>
                    <input 
                      type="text" 
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-4 py-2 rounded-[var(--radius-theme)] bg-[var(--color-page)] border border-[var(--color-border-theme)] focus:border-[var(--color-accent)] outline-none transition-all text-[var(--color-main)]"
                      placeholder="例如：致亲爱的朋友们"
                    />
                 </div>
              </div>
           </div>

           {/* 2. Recipe Selection */}
           <div className="glass-panel p-6 rounded-[var(--radius-theme)] border border-[var(--color-border-theme)] space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-[var(--color-main)] flex items-center gap-2">
                    <Utensils className="h-5 w-5 text-[var(--color-accent)]" />
                    选择菜品 ({selectedRecipes.length})
                </h3>
                {selectedRecipes.length > 0 && (
                    <button 
                        onClick={() => setSelectedRecipes([])}
                        className="text-xs text-[var(--color-muted)] hover:text-red-500 transition-colors"
                    >
                        清空选择
                    </button>
                )}
              </div>

              <div className="h-[400px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {recipes.map(recipe => {
                      const isSelected = selectedRecipes.some(r => r.id === recipe.id)
                      return (
                          <button
                            key={recipe.id}
                            onClick={() => toggleRecipe(recipe)}
                            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                                isSelected 
                                ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]' 
                                : 'bg-[var(--color-page)] border-[var(--color-border-theme)] hover:border-[var(--color-muted)]'
                            }`}
                          >
                              <div>
                                  <div className={`font-medium ${isSelected ? 'text-[var(--color-accent)]' : 'text-[var(--color-main)]'}`}>
                                      {recipe.title}
                                  </div>
                                  <div className="text-xs text-[var(--color-muted)] flex gap-2">
                                      {recipe.category && <span className="uppercase">{recipe.category}</span>}
                                      {recipe.cuisine && <span>• {recipe.cuisine}</span>}
                                  </div>
                              </div>
                              {isSelected && <Check className="h-5 w-5 text-[var(--color-accent)]" />}
                          </button>
                      )
                  })}
              </div>
           </div>

        </div>

        {/* Right: Live Preview */}
        <div className="sticky top-8 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-[var(--color-main)] flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-[var(--color-accent)]" />
                    实时预览
                </h3>
                <button
                    onClick={handleDownload}
                    disabled={selectedRecipes.length === 0 || isGenerating}
                    className="px-4 py-2 rounded-full bg-[var(--color-accent)] text-white text-sm font-bold shadow-lg hover:shadow-[var(--color-accent)]/30 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isGenerating ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    {mode === "personal" ? "保存图片" : "EXPORT_PNG"}
                </button>
            </div>

            {/* Canvas Area */}
            <div className="w-full aspect-[3/4] bg-[var(--color-card)] rounded-xl border border-[var(--color-border-theme)] shadow-2xl overflow-hidden flex items-center justify-center p-4">
                <div 
                    ref={previewRef}
                    className="w-full h-full bg-white relative flex flex-col p-8 md:p-12 items-center text-center justify-between"
                    style={{
                        backgroundColor: '#fffcf5', // Creamy paper background
                        backgroundImage: 'radial-gradient(#e5e5f7 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                        color: '#2d3436'
                    }}
                >
                    {/* Decorative Border - Art Deco Style */}
                    <div className="absolute inset-3 pointer-events-none" 
                         style={{ border: '1px solid rgba(45, 52, 54, 0.15)' }} />
                    <div className="absolute inset-5 pointer-events-none" 
                         style={{ border: '2px solid rgba(45, 52, 54, 0.8)' }} />
                    
                    {/* Corner Accents */}
                    <div className="absolute top-5 left-5 w-2 h-2 bg-[#2d3436] pointer-events-none" />
                    <div className="absolute top-5 right-5 w-2 h-2 bg-[#2d3436] pointer-events-none" />
                    <div className="absolute bottom-5 left-5 w-2 h-2 bg-[#2d3436] pointer-events-none" />
                    <div className="absolute bottom-5 right-5 w-2 h-2 bg-[#2d3436] pointer-events-none" />

                    {/* Header */}
                    <div className="w-full relative z-10">
                        <div className="w-12 h-12 mx-auto mb-4" style={{ color: '#2d3436', opacity: 0.8 }}>
                            <ChefHat className="w-full h-full" strokeWidth={1.5} />
                        </div>
                        <h2 className="text-3xl font-serif font-bold tracking-wider mb-2 uppercase" style={{ color: '#2d3436' }}>
                            {menuTitle || "MENU"}
                        </h2>
                        {guestName && (
                            <p className="text-sm font-serif italic" style={{ color: '#2d3436', opacity: 0.6 }}>
                                {guestName}
                            </p>
                        )}
                        <div className="w-16 h-px mx-auto mt-6" style={{ backgroundColor: '#2d3436', opacity: 0.2 }} />
                    </div>

                    {/* Menu Items */}
                    <div className="flex-1 w-full flex flex-col justify-center gap-6 py-8 relative z-10">
                        {selectedRecipes.length > 0 ? (
                            selectedRecipes.map((recipe, index) => (
                                <div key={recipe.id} className="w-full">
                                    <h4 className="text-xl font-serif font-medium mb-1 tracking-wide" style={{ color: '#2d3436' }}>
                                        {recipe.title}
                                    </h4>
                                    <p className="text-xs uppercase tracking-widest font-sans" style={{ color: '#2d3436', opacity: 0.5 }}>
                                        {recipe.category || 'Special'}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="italic" style={{ color: '#b2bec3' }}>请选择左侧菜品...</div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="w-full pt-8 relative z-10" style={{ 
                        borderTop: '1px solid rgba(45, 52, 54, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div className="text-[10px] uppercase tracking-[0.2em] font-bold mb-4" style={{ color: '#2d3436', opacity: 0.5 }}>
                            Curated by {userName}
                        </div>
                        
                        {/* Premium Branding */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            padding: '8px 16px', 
                            border: '1px solid rgba(45, 52, 54, 0.2)', 
                            borderRadius: '4px' 
                        }}>
                            <ChefHat className="w-4 h-4" style={{ color: '#2d3436', display: 'block' }} />
                            <span id="menu-brand-text" className="font-serif font-bold tracking-widest text-xs uppercase" style={{ 
                                color: '#2d3436',
                                lineHeight: '1',
                                display: 'block'
                            }}>
                                Chef's Manual
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </div>

      </div>
    </div>
  )
}

