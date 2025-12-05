-- Make sure ingredients table has RLS
alter table ingredients enable row level security;

-- Policy for ingredients: Users can view ingredients of recipes they own
create policy "Users can view own recipe ingredients"
  on ingredients for select
  using (
    exists (
      select 1 from recipes
      where recipes.id = ingredients.recipe_id
      and recipes.author_id = auth.uid()
    )
  );

-- Policy for recipes: Users can view their own recipes
alter table recipes enable row level security;

create policy "Users can view own recipes"
  on recipes for select
  using (auth.uid() = author_id);

