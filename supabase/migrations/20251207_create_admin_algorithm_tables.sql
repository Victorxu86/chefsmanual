-- 1. 动作定义表 (替代 hardcoded ACTIONS 和 regex)
create table sys_algorithm_actions (
  id uuid default gen_random_uuid() primary key,
  label text not null, -- 显示名称: "爆炒"
  keywords text[] not null, -- 匹配关键词: ["爆炒", "stir-fry", "fast-fry"]
  step_type text not null, -- 'prep', 'cook', 'wait', 'serve'
  
  -- 算法参数
  default_load float not null default 1.0, -- 默认负载 (0.1 - 1.0)
  is_active boolean default true, -- 是否需要人手
  can_be_passive boolean default false, -- 是否允许转为被动 (如"转小火")
  
  affinity_group text, -- 亲和力分组: 'cutting', 'washing', 'heating' (用于上下文合并)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 菜品分类表 (替代 hardcoded priorityMap 和 offset 逻辑)
create table sys_dish_categories (
  id uuid default gen_random_uuid() primary key,
  slug text not null unique, -- 'main', 'cold', 'soup'
  label text not null, -- "热菜/主菜", "凉菜"
  
  -- 算法参数
  schedule_priority int default 1, -- 排课优先级 (数字越大越先排)
  end_time_offset int default 0, -- 期望结束时间相对于开饭时间的偏移 (秒), e.g. -1800 (提前30分钟)
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 插入默认数据 (迁移现有的硬编码逻辑)
insert into sys_dish_categories (slug, label, schedule_priority, end_time_offset) values
('main', '热菜/主菜', 5, 0),
('staple', '主食', 4, 0),
('soup', '汤羹', 3, -600),
('cold', '凉菜/前菜', 2, -1800),
('dessert', '甜点', 1, -1800),
('drink', '饮品', 1, 0);

insert into sys_algorithm_actions (label, keywords, step_type, default_load, is_active, affinity_group) values
('切/备料', ARRAY['切', '剁', '拍', '削', 'chop', 'slice', 'mince'], 'prep', 0.9, true, 'cutting'),
('洗/清洗', ARRAY['洗', '冲', '泡', 'wash', 'rinse'], 'prep', 0.8, true, 'washing'),
('腌制/静置', ARRAY['腌', '静置', 'marinate', 'rest'], 'wait', 0.0, false, null),
('爆炒', ARRAY['炒', '煎', 'stir-fry', 'pan-fry'], 'cook', 1.0, true, 'high_heat'),
('炖煮', ARRAY['炖', '煮', '焖', '熬', 'stew', 'boil', 'simmer'], 'cook', 0.2, true, 'low_heat'),
('烤/蒸', ARRAY['烤', '蒸', 'bake', 'roast', 'steam'], 'cook', 0.05, true, 'oven_work'),
('摆盘', ARRAY['装盘', '盛', 'serve', 'plate'], 'serve', 1.0, true, 'serving');

-- 开启 RLS 但允许所有 authenticated 用户读写 (既然是个人版)
alter table sys_algorithm_actions enable row level security;
alter table sys_dish_categories enable row level security;

create policy "Enable all access for users" on sys_algorithm_actions for all using (true);
create policy "Enable all access for users" on sys_dish_categories for all using (true);

