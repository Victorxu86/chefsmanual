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

const STEPS = [
  { id: 1, title: "基本信息" },
  { id: 2, title: "食材清单" },
  { id: 3, title: "烹饪流程" },
]

export default function CreateRecipePage() {
  const { mode } = useMode()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 移除泛型 <RecipeFormValues> 以允许类型推断兼容
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
// ... rest of the file
