-- Make sure recipe_ingredients table has RLS
alter table recipe_ingredients enable row level security;

-- Policy for ingredients: Users can view ingredients of recipes they own
-- Drop existing if conflict (optional safety, usually for idempotent scripts)
drop policy if exists "Users can view own recipe ingredients" on recipe_ingredients;

create policy "Users can view own recipe ingredients"
  on recipe_ingredients for select
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.author_id = auth.uid()
    )
  );

-- Policy for recipes: Users can view their own recipes
alter table recipes enable row level security;

-- Drop existing if conflict
drop policy if exists "Users can view own recipes" on recipes;

create policy "Users can view own recipes"
  on recipes for select
  using (auth.uid() = author_id);
