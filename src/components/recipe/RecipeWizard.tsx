"use client"

import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { recipeSchema } from "@/lib/schemas"
import { createRecipe } from "@/app/create-recipe/actions"
import { updateRecipe } from "@/app/create-recipe/updateAction"
import { useMode } from "@/context/ModeContext"
import { Step1Meta } from "@/app/create-recipe/steps/Step1Meta"
import { Step2Ingredients } from "@/app/create-recipe/steps/Step2Ingredients"
import { Step3Timeline } from "@/app/create-recipe/steps/Step3Timeline"
import { Save, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

const STEPS = [
  { id: 1, title: "基本信息" },
  { id: 2, title: "食材清单" },
  { id: 3, title: "烹饪流程" },
]

interface RecipeWizardProps {
  initialData?: any
  isEditMode?: boolean
}

export function RecipeWizard({ initialData, isEditMode = false }: RecipeWizardProps) {
  const { mode } = useMode()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Transform initial data to match form structure if needed
  // 假设 initialData 已经是我们想要的结构，或者需要简单的映射
  const defaultValues = initialData ? {
    title: initialData.title,
    description: initialData.description,
    servings: initialData.servings,
    difficulty: initialData.difficulty,
    cuisine: initialData.cuisine,
    is_public: initialData.is_public,
    ingredients: initialData.recipe_ingredients || [],
    // Step data transformation might be needed here to match V5 format
    // For now assuming steps match except for _temp fields
    steps: (initialData.recipe_steps || []).map((s: any) => ({
      ...s,
      duration: s.duration_seconds, // Map back seconds to duration
      // _selectedIngredients needs reverse mapping from UUIDs to indices if we want to support re-editing ingredients linkage
      // This is complex: Backend has UUIDs, Frontend uses array indices.
      // For V1 Edit, we might lose linkage visualization in Step 3 form unless we map UUIDs back to current array indices.
    }))
  } : {
    title: "",
    description: "",
    servings: 2,
    difficulty: "medium",
    is_public: false,
    ingredients: [],
    steps: []
  }

  const methods = useForm({
    resolver: zodResolver(recipeSchema),
    defaultValues
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      let result
      if (isEditMode && initialData?.id) {
        result = await updateRecipe(initialData.id, data)
      } else {
        result = await createRecipe(data)
      }
      
      if (result?.error) {
        alert(result.error)
      } else if (result?.success) {
        router.push('/recipes')
      }
    } catch (error: any) {
      console.error(error)
      alert("发生错误: " + (error.message || "未知错误"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors)
    if (errors.title || errors.description || errors.servings) {
      alert(`基本信息有误: ${errors.title?.message || ''}`)
      setCurrentStep(1)
    } else if (errors.ingredients) {
      alert("食材清单有误")
      setCurrentStep(2)
    } else if (errors.steps) {
      alert("烹饪流程校验失败")
      setCurrentStep(3)
    }
  }

  const handleNext = async () => {
    let valid = false
    if (currentStep === 1) {
      valid = await methods.trigger(["title", "description", "servings", "cuisine", "difficulty"])
    } else if (currentStep === 2) {
      valid = true 
    }

    if (valid) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault()
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-[var(--color-main)] mb-2">
          {isEditMode ? "编辑菜谱" : (mode === "personal" ? "创建新菜谱" : "DEFINE_NEW_SOP")}
        </h1>
        
        <div className="flex justify-center items-center gap-4 mt-6">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all
                ${currentStep >= step.id ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-border-theme)] text-[var(--color-muted)]'}
              `}>
                {currentStep > step.id ? <CheckCircle2 className="h-5 w-5" /> : step.id}
              </div>
              <span className={`ml-2 text-sm font-medium ${currentStep >= step.id ? 'text-[var(--color-main)]' : 'text-[var(--color-muted)]'}`}>
                {step.title}
              </span>
              {idx < STEPS.length - 1 && (
                <div className="w-12 h-px bg-[var(--color-border-theme)] mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      <FormProvider {...methods}>
        <form 
          onSubmit={(e) => e.preventDefault()} 
          onKeyDown={handleKeyDown}
          className="space-y-8"
        >
          <div className="min-h-[400px]">
            {currentStep === 1 && <Step1Meta />}
            {currentStep === 2 && <Step2Ingredients />}
            {currentStep === 3 && <Step3Timeline />}
          </div>

          <div className="sticky bottom-8 z-20 flex justify-between p-4 rounded-[var(--radius-theme)] bg-[var(--color-card)]/80 backdrop-blur border border-[var(--color-border-theme)] shadow-xl">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="px-6 py-2 rounded-[var(--radius-theme)] text-[var(--color-muted)] hover:bg-[var(--color-page)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> 上一步
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-2 rounded-[var(--radius-theme)] bg-[var(--color-main)] text-[var(--color-page)] font-bold hover:opacity-90 transition-all flex items-center gap-2"
              >
                下一步 <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={methods.handleSubmit(onSubmit, onError)}
                disabled={isSubmitting}
                className="px-8 py-2 rounded-[var(--radius-theme)] bg-[var(--color-accent)] text-white font-bold hover:opacity-90 transition-all flex items-center gap-2"
              >
                {isSubmitting ? "保存中..." : (isEditMode ? "更新菜谱" : "完成并保存")} <Save className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>
      </FormProvider>
    </main>
  )
}

