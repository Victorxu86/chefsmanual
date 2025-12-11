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
      .select('id, title, updated_at, cuisine, category, total_time_minutes')
      .eq('author_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(3)
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

  // D. Generate Recipe Recommendations (Server Side Logic)
  // Logic: Find recipes that complement the recent ones or popular combinations
  // For now, simple logic: Pick 3 recipes from different categories (e.g. 1 main, 1 soup, 1 cold)
  // If not enough recipes, pick random.
  
  // Fetch all recipes (lightweight) for recommendation
  const { data: allRecipes } = await supabase
    .from('recipes')
    .select('id, title, category, total_time_minutes')
    .eq('author_id', user.id)
  
  let recommendations: any[] = []
  
  if (allRecipes && allRecipes.length >= 2) {
      // Strategy: "Balanced Meal"
      // Try to find: Main + Soup + (Side/Cold/Dessert)
      const mains = allRecipes.filter(r => r.category === 'main' || !r.category)
      const soups = allRecipes.filter(r => r.category === 'soup')
      const sides = allRecipes.filter(r => ['cold', 'dessert', 'side'].includes(r.category || ''))
      
      const r1 = mains.length > 0 ? mains[Math.floor(Math.random() * mains.length)] : allRecipes[0]
      // Ensure r2 is different from r1
      const availableForR2 = soups.length > 0 ? soups : allRecipes.filter(r => r.id !== r1.id)
      const r2 = availableForR2.length > 0 ? availableForR2[Math.floor(Math.random() * availableForR2.length)] : null
      
      // Ensure r3 is different from r1 and r2
      const availableForR3 = sides.length > 0 ? sides : allRecipes.filter(r => r.id !== r1.id && (r2 ? r.id !== r2.id : true))
      const r3 = availableForR3.length > 0 ? availableForR3[Math.floor(Math.random() * availableForR3.length)] : null

      recommendations = [r1, r2, r3].filter(Boolean)
  }

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
          recommendations={recommendations}
        />
      </main>
    </div>
  )
}
