import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { DashboardHeader } from "@/components/DashboardHeader"
import { DashboardContent } from "./content"

// Helper to calculate serial duration for a list of recipes
function calculateSerialDuration(recipes: any[]): number {
  if (!recipes || !Array.isArray(recipes)) return 0;
  
  return recipes.reduce((total, recipe) => {
    // 1. Try to use total_time_minutes
    if (recipe.total_time_minutes) {
      return total + (recipe.total_time_minutes * 60);
    }
    // 2. Fallback: Sum of step durations
    if (recipe.recipe_steps && Array.isArray(recipe.recipe_steps)) {
      const stepsDuration = recipe.recipe_steps.reduce((sum: number, step: any) => {
        return sum + (step.duration_seconds || 0);
      }, 0);
      return total + stepsDuration;
    }
    // 3. Fallback: Rough estimate (e.g., 30 mins)
    return total + 1800;
  }, 0);
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  // === 1. Fetch Data in Parallel ===
  const [sessionsRes, recentRecipesRes] = await Promise.all([
    // A. Fetch all sessions for statistics (Optimized: select only needed fields)
    supabase
      .from('cooking_sessions')
      .select('id, created_at, total_duration_seconds, recipes, status')
      .eq('user_id', user.id)
      .eq('status', 'completed') // Only count completed sessions
      .order('created_at', { ascending: false }),

    // B. Fetch recent recipes
    supabase
      .from('recipes')
      .select('id, title, updated_at')
      .eq('author_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(5)
  ])

  const sessions = sessionsRes.data || []
  const recentRecipes = recentRecipesRes.data || []

  // === 2. Calculate Statistics (Server Side) ===
  
  // A. Weekly Count
  const now = new Date()
  // Get Monday of current week (adjusting for Sunday=0)
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  const startOfWeek = new Date(now.setDate(diff))
  startOfWeek.setHours(0, 0, 0, 0)
  
  const weeklyCount = sessions.filter(s => {
    const d = new Date(s.created_at)
    return d >= startOfWeek
  }).length

  // B. Total Saved Time
  let totalSavedSeconds = 0
  
  sessions.forEach(session => {
    const actual = session.total_duration_seconds || 0
    const serial = calculateSerialDuration(session.recipes)
    
    // Only count if serial > actual (valid optimization)
    // And ensure we don't have bad data (e.g. actual=0)
    if (actual > 0 && serial > actual) {
      totalSavedSeconds += (serial - actual)
    }
  })

  const totalSavedMinutes = Math.floor(totalSavedSeconds / 60)

  // C. Prepare Recent Activity Data (First 3 sessions)
  const recentActivity = sessions.slice(0, 3).map(s => ({
    id: s.id,
    created_at: s.created_at,
    total_duration_seconds: s.total_duration_seconds,
    recipe_count: Array.isArray(s.recipes) ? s.recipes.length : 0,
    recipe_titles: Array.isArray(s.recipes) ? s.recipes.map((r: any) => r.title).slice(0, 2) : []
  }))

  return (
    <div className="min-h-screen bg-[var(--color-page)] transition-colors duration-700">
      <DashboardHeader userEmail={user.email || ""} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardContent 
          userName={user.user_metadata.full_name || "Chef"}
          stats={{
            weeklyCount,
            totalSavedMinutes
          }}
          recentRecipes={recentRecipes}
          recentActivity={recentActivity}
        />
      </main>
    </div>
  )
}
