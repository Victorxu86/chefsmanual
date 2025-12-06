-- Make sure recipe_ingredients table has RLS
alter table recipe_ingredients enable row level security;

-- Policy for ingredients: Users can view ingredients if recipe is their own OR is public
drop policy if exists "Users can view accessible recipe ingredients" on recipe_ingredients;

create policy "Users can view accessible recipe ingredients"
  on recipe_ingredients for select
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_ingredients.recipe_id
      and (recipes.author_id = auth.uid() OR recipes.is_public = true)
    )
  );

-- Policy for recipes: Users can view if their own OR is public
alter table recipes enable row level security;

drop policy if exists "Users can view accessible recipes" on recipes;

create policy "Users can view accessible recipes"
  on recipes for select
  using (auth.uid() = author_id OR is_public = true);

