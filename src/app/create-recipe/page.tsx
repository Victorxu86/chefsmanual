"use client"

import { useState } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { recipeSchema, type RecipeFormValues } from "@/lib/schemas"
import { createRecipe } from "./actions"
import { DashboardHeader } from "@/components/DashboardHeader"
import { useMode } from "@/context/ModeContext"
import { Step1Meta } from "./steps/Step1Meta"
import { Step2Ingredients } from "./steps/Step2Ingredients"
import { Step3Flow } from "./steps/Step3Flow"
import { Save, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"

const STEPS = [
  { id: 1, title: "基本信息" },
  { id: 2, title: "食材清单" },
  { id: 3, title: "烹饪流程" },
]

export default function CreateRecipePage() {
  const { mode } = useMode()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const methods = useForm({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: "",
      description: "",
      servings: 2,
      difficulty: "medium",
      is_public: false,
      ingredients: [],
      steps: []
    }
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const result = await createRecipe(data)
      if (result?.error) {
        alert(result.error)
      } else if (result?.success) {
        // Success! Redirect to dashboard
        router.push('/dashboard')
      }
    } catch (error: any) {
      console.error(error)
      alert("发生错误: " + (error.message || "未知错误"))
    } finally {
      setIsSubmitting(false)
    }
  }

  // 改进：分步验证
  const handleNext = async () => {
    let valid = false
    
    if (currentStep === 1) {
      // Step 1 只验证基本信息
      valid = await methods.trigger(["title", "description", "servings", "cuisine", "difficulty"])
    } else if (currentStep === 2) {
      // Step 2 验证食材 (暂时不强制，可以没有食材)
      // 如果需要验证 ingredients 数组非空，可以在 schema 加 .min(1)
      valid = true 
    }

    if (valid) {
      setCurrentStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail="" />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[var(--color-main)] mb-2">
            {mode === "personal" ? "创建新菜谱" : "DEFINE_NEW_SOP"}
          </h1>
          
          {/* Progress Bar */}
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
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Step Content */}
            <div className="min-h-[400px]">
              {currentStep === 1 && <Step1Meta />}
              {currentStep === 2 && <Step2Ingredients />}
              {currentStep === 3 && <Step3Flow />}
            </div>

            {/* Navigation Buttons */}
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
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-2 rounded-[var(--radius-theme)] bg-[var(--color-accent)] text-white font-bold hover:opacity-90 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? "保存中..." : "完成并保存"} <Save className="h-4 w-4" />
                </button>
              )}
            </div>

          </form>
        </FormProvider>

      </main>
    </div>
  )
}
