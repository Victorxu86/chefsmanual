-- 1. 重构动作表 (支持层级分类)
-- 先删除旧表 (如果存在)
drop table if exists sys_algorithm_actions;

create table sys_algorithm_actions (
  id uuid default gen_random_uuid() primary key,
  label text not null, -- 显示名称: "爆炒"
  category text not null, -- 大类: "加热", "备菜", "调味", "摆盘"
  subcategory text, -- 子类: "炒", "煮", "切", "洗" (可选，用于更细粒度归类)
  
  keywords text[] not null, -- 匹配关键词: ["爆炒", "stir-fry"]
  step_type text not null, -- 对应算法底层类型: 'prep', 'cook', 'wait', 'serve'
  
  -- 算法参数
  default_load float not null default 1.0, -- 默认负载 (0.1 - 1.0)
  is_active boolean default true, -- 是否需要人手
  can_be_passive boolean default false, -- 是否允许转为被动
  
  affinity_group text, -- 亲和力分组 (用于合并)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 新增元数据配置表
create table sys_measurement_units (
  id uuid default gen_random_uuid() primary key,
  label text not null unique, -- "克", "勺", "适量"
  type text not null, -- "mass", "volume", "count", "vague"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table sys_cuisines (
  id uuid default gen_random_uuid() primary key,
  label text not null unique, -- "川菜", "粤菜", "西式"
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table sys_difficulty_levels (
  id uuid default gen_random_uuid() primary key,
  label text not null unique, -- "新手", "进阶", "大师"
  level_value int not null, -- 1, 2, 3 (用于排序)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. 补充 RLS
alter table sys_measurement_units enable row level security;
alter table sys_cuisines enable row level security;
alter table sys_difficulty_levels enable row level security;

create policy "Enable all access for users" on sys_measurement_units for all using (true);
create policy "Enable all access for users" on sys_cuisines for all using (true);
create policy "Enable all access for users" on sys_difficulty_levels for all using (true);

-- 4. 插入默认数据
insert into sys_measurement_units (label, type) values
('克', 'mass'), ('千克', 'mass'),
('毫升', 'volume'), ('升', 'volume'), ('勺', 'volume'), ('杯', 'volume'),
('个', 'count'), ('只', 'count'), ('片', 'count'), ('把', 'count'),
('适量', 'vague'), ('少许', 'vague');

insert into sys_cuisines (label) values 
('中式 - 川菜'), ('中式 - 粤菜'), ('中式 - 鲁菜'), ('中式 - 苏菜'),
('中式 - 家常'), ('日式'), ('韩式'), ('西式 - 法餐'), ('西式 - 意餐');

insert into sys_difficulty_levels (label, level_value) values
('简单 (新手)', 1),
('中等 (进阶)', 2),
('困难 (挑战)', 3),
('大师 (米其林)', 4);

-- 重新插入 Actions 数据 (带大类)
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
-- 加热类
('加热', '炒', '爆炒', ARRAY['爆炒', 'stir-fry'], 'cook', 1.0, true, 'high_heat'),
('加热', '炒', '滑炒', ARRAY['滑炒'], 'cook', 0.8, true, 'high_heat'),
('加热', '炒', '煸炒', ARRAY['煸炒'], 'cook', 0.9, true, 'high_heat'),
('加热', '煎', '煎', ARRAY['煎', 'pan-fry'], 'cook', 0.6, true, 'medium_heat'),
('加热', '煮', '焯水', ARRAY['焯水', 'blanch'], 'cook', 0.3, true, 'water_cook'),
('加热', '煮', '慢炖', ARRAY['炖', 'stew', 'simmer'], 'cook', 0.1, true, 'low_heat'),
('加热', '煮', '大火煮', ARRAY['煮', 'boil'], 'cook', 0.2, true, 'water_cook'),
-- 备菜类
('备菜', '刀工', '切丝', ARRAY['切丝', 'shred'], 'prep', 0.9, true, 'cutting'),
('备菜', '刀工', '切片', ARRAY['切片', 'slice'], 'prep', 0.9, true, 'cutting'),
('备菜', '刀工', '切块', ARRAY['切块', 'chop'], 'prep', 0.9, true, 'cutting'),
('备菜', '刀工', '剁碎', ARRAY['剁碎', 'mince'], 'prep', 1.0, true, 'cutting'),
('备菜', '清洗', '清洗', ARRAY['洗', 'wash'], 'prep', 0.7, true, 'washing'),
('备菜', '处理', '去皮', ARRAY['去皮', 'peel'], 'prep', 0.6, true, 'processing'),
-- 等待类
('静置', '腌制', '腌制', ARRAY['腌', 'marinate'], 'wait', 0.0, false, null),
('静置', '冷却', '冷却', ARRAY['冷却', 'cool'], 'wait', 0.0, false, null),
-- 结尾类
('收尾', '装盘', '精细摆盘', ARRAY['摆盘', 'plate'], 'serve', 1.0, true, 'serving');

