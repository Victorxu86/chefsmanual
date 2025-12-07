"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

const ADMIN_PASSWORD = "0806"
const COOKIE_NAME = "chefs_admin_session"

// === Authentication ===

export async function adminLogin(prevState: any, formData: FormData) {
  const password = formData.get("password") as string
  
  if (password === ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    // Set cookie for 1 day
    cookieStore.set(COOKIE_NAME, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, 
      path: "/",
    })
    redirect("/admin")
  } else {
    return { error: "Invalid Access Code" }
  }
}

export async function adminLogout() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
  redirect("/admin/login")
}

export async function checkAdminSession() {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value === "authenticated"
}

// === CRUD Actions: Algorithm Actions ===

export async function createAction(prevState: any, formData: FormData) {
  const supabase = await createClient()
  
  const label = formData.get("label") as string
  const keywordsStr = formData.get("keywords") as string
  const step_type = formData.get("step_type") as string
  const default_load = parseFloat(formData.get("default_load") as string)
  const is_active = formData.get("is_active") === "on"
  const affinity_group = formData.get("affinity_group") as string || null

  const keywords = keywordsStr.split(",").map(k => k.trim()).filter(Boolean)

  const { error } = await supabase.from("sys_algorithm_actions").insert({
    label,
    keywords,
    step_type,
    default_load,
    is_active,
    affinity_group
  })

  if (error) return { error: error.message }
  revalidatePath("/admin")
  return { success: true }
}

export async function deleteAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("sys_algorithm_actions").delete().eq("id", id)
  if (error) throw error
  revalidatePath("/admin")
}

// === CRUD Actions: Dish Categories ===

export async function updateCategory(id: string, formData: FormData) {
    const supabase = await createClient()
    
    const priority = parseInt(formData.get("priority") as string)
    const offset = parseInt(formData.get("offset") as string)
    
    const { error } = await supabase
        .from("sys_dish_categories")
        .update({ schedule_priority: priority, end_time_offset: offset })
        .eq("id", id)

    if (error) return { error: error.message }
    revalidatePath("/admin")
    return { success: true }
}

