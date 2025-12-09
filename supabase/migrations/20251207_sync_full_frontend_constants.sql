-- 1. 清空旧数据 (确保没有残留的不一致数据)
-- 注意：生产环境请勿随意清空，应使用 upsert，但这里我们假定是一次性同步
truncate table sys_algorithm_actions restart identity;
truncate table sys_measurement_units restart identity;
truncate table sys_cuisines restart identity;
truncate table sys_difficulty_levels restart identity;
truncate table sys_dish_categories restart identity;

-- 2. 同步基础元数据 (来自 constants.ts)

-- [CUISINES]
insert into sys_cuisines (label) values 
('中餐'), ('西餐'), ('日料'), ('法餐'), ('意餐'), ('烘焙'), ('其他');

-- [DIFFICULTIES] (Level映射: easy=1, medium=2, hard=3, chef=4)
insert into sys_difficulty_levels (label, level_value) values
('简单 (Easy)', 1),
('中等 (Medium)', 2),
('困难 (Hard)', 3),
('专业 (Chef)', 4);

-- [INGREDIENT_UNITS] (映射 type: precise -> mass/volume/count, vague -> vague)
-- 注意：原 constants.ts 并没有区分 mass/volume，统称为 precise。我们在 Admin 中细分了，这里做个大致映射。
insert into sys_measurement_units (label, type) values
('克 (g)', 'mass'), 
('千克 (kg)', 'mass'),
('毫升 (ml)', 'volume'), 
('升 (L)', 'volume'),
('茶匙', 'volume'),
('汤匙', 'volume'),
('杯', 'volume'),
('个/只/根', 'count'), -- pcs
('适量', 'vague'),
('少许', 'vague'),
('一撮', 'vague'),
('一点', 'vague'),
('按口味', 'vague');

-- [RECIPE_CATEGORIES]
-- (注意：offset 需要根据 description 重新推断，原 constants.ts 无此字段)
insert into sys_dish_categories (slug, label, schedule_priority, end_time_offset) values
('main', '热菜/主菜', 5, 0), -- 必须对齐开饭
('staple', '主食', 4, 0), -- 必须对齐 (虽可保温，但热腾腾最好)
('soup', '汤/炖菜', 3, -600), -- 提前10分钟
('cold', '凉菜', 2, -1800), -- 提前30分钟
('dessert', '甜品', 1, 0), -- 饭后 (这里设为0，或者正数表示饭后？目前逻辑只支持负数，暂设0)
('drink', '饮品', 1, 0);

-- 3. 同步海量动作 (来自 ACTION_HIERARCHY)
-- 我们将解析 constants.ts 中的层级结构并展开

-- === [领域: 加热/烹调] ===

-- Category: 炒 (Active)
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('加热/烹调', '炒 (Active)', '炒', ARRAY['炒', 'stir-fry'], 'cook', 1.0, true, 'high_heat'),
('加热/烹调', '炒 (Active)', '快炒', ARRAY['快炒'], 'cook', 1.0, true, 'high_heat'),
('加热/烹调', '炒 (Active)', '爆炒', ARRAY['爆炒'], 'cook', 1.0, true, 'high_heat'),
('加热/烹调', '炒 (Active)', '煸炒', ARRAY['煸炒'], 'cook', 0.9, true, 'high_heat'),
('加热/烹调', '炒 (Active)', '干煸', ARRAY['干煸'], 'cook', 0.9, true, 'high_heat'),
('加热/烹调', '炒 (Active)', '清炒', ARRAY['清炒'], 'cook', 0.8, true, 'high_heat'),
('加热/烹调', '炒 (Active)', '翻炒', ARRAY['翻炒'], 'cook', 0.8, true, 'high_heat'),
('加热/烹调', '炒 (Active)', '收炒', ARRAY['收炒'], 'cook', 0.8, true, 'high_heat');

-- Category: 煎 (Active)
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('加热/烹调', '煎 (Active)', '煎', ARRAY['煎', 'pan-fry'], 'cook', 0.6, true, 'medium_heat'),
('加热/烹调', '煎 (Active)', '煎封', ARRAY['煎封'], 'cook', 0.6, true, 'medium_heat'),
('加热/烹调', '煎 (Active)', '小火慢煎', ARRAY['慢煎'], 'cook', 0.4, true, 'medium_heat'),
('加热/烹调', '煎 (Active)', '平底锅煎', ARRAY['平底锅煎'], 'cook', 0.6, true, 'medium_heat'),
('加热/烹调', '煎 (Active)', '煎至金黄', ARRAY['煎至金黄'], 'cook', 0.5, true, 'medium_heat'),
('加热/烹调', '煎 (Active)', '煎至定型', ARRAY['煎至定型'], 'cook', 0.5, true, 'medium_heat');

-- Category: 炸 (Active)
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('加热/烹调', '炸 (Active)', '油炸', ARRAY['油炸', 'deep-fry'], 'cook', 1.0, true, 'high_heat'),
('加热/烹调', '炸 (Active)', '深炸', ARRAY['深炸'], 'cook', 1.0, true, 'high_heat'),
('加热/烹调', '炸 (Active)', '浅炸', ARRAY['浅炸'], 'cook', 0.8, true, 'high_heat'),
('加热/烹调', '炸 (Active)', '复炸', ARRAY['复炸'], 'cook', 1.0, true, 'high_heat'),
('加热/烹调', '炸 (Active)', '酥炸', ARRAY['酥炸'], 'cook', 1.0, true, 'high_heat'),
('加热/烹调', '炸 (Active)', '裹粉炸', ARRAY['裹粉炸'], 'cook', 1.0, true, 'high_heat'),
('加热/烹调', '炸 (Active)', '裹糊炸', ARRAY['裹糊炸'], 'cook', 1.0, true, 'high_heat'),
('加热/烹调', '炸 (Active)', '半煎炸', ARRAY['半煎炸'], 'cook', 0.9, true, 'high_heat');

-- Category: 烤/烘焙 (Passive)
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('加热/烹调', '烤/烘焙 (Passive)', '烤箱烤', ARRAY['烤箱烤', 'bake'], 'cook', 0.05, true, 'oven_work'),
('加热/烹调', '烤/烘焙 (Passive)', '烘烤', ARRAY['烘烤'], 'cook', 0.05, true, 'oven_work'),
('加热/烹调', '烤/烘焙 (Passive)', '热风烤', ARRAY['热风烤'], 'cook', 0.05, true, 'oven_work'),
('加热/烹调', '烤/烘焙 (Passive)', '上下火烤', ARRAY['上下火烤'], 'cook', 0.05, true, 'oven_work'),
('加热/烹调', '烤/烘焙 (Passive)', '焗烤', ARRAY['焗烤'], 'cook', 0.05, true, 'oven_work'),
('加热/烹调', '烤/烘焙 (Passive)', '风干烤', ARRAY['风干烤'], 'cook', 0.05, true, 'oven_work'),
('加热/烹调', '烤/烘焙 (Passive)', '预烤', ARRAY['预烤'], 'cook', 0.05, true, 'oven_work');

-- Category: 蒸 (Passive)
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('加热/烹调', '蒸 (Passive)', '清蒸', ARRAY['清蒸', 'steam'], 'cook', 0.1, true, 'water_cook'),
('加热/烹调', '蒸 (Passive)', '隔水蒸', ARRAY['隔水蒸'], 'cook', 0.1, true, 'water_cook'),
('加热/烹调', '蒸 (Passive)', '旺火蒸', ARRAY['旺火蒸'], 'cook', 0.1, true, 'water_cook'),
('加热/烹调', '蒸 (Passive)', '中火蒸', ARRAY['中火蒸'], 'cook', 0.1, true, 'water_cook'),
('加热/烹调', '蒸 (Passive)', '小火蒸', ARRAY['小火蒸'], 'cook', 0.1, true, 'water_cook'),
('加热/烹调', '蒸 (Passive)', '蒸至熟', ARRAY['蒸至熟'], 'cook', 0.1, true, 'water_cook'),
('加热/烹调', '蒸 (Passive)', '蒸至定型', ARRAY['蒸至定型'], 'cook', 0.1, true, 'water_cook');

-- Category: 煮/焯 (Active)
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('加热/烹调', '煮/焯 (Active)', '煮', ARRAY['煮', 'boil'], 'cook', 0.3, true, 'water_cook'),
('加热/烹调', '煮/焯 (Active)', '汆', ARRAY['汆'], 'cook', 0.5, true, 'water_cook'),
('加热/烹调', '煮/焯 (Active)', '焯水', ARRAY['焯水', 'blanch'], 'cook', 0.4, true, 'water_cook'),
('加热/烹调', '煮/焯 (Active)', '飞水', ARRAY['飞水'], 'cook', 0.4, true, 'water_cook'),
('加热/烹调', '煮/焯 (Active)', '滚煮', ARRAY['滚煮'], 'cook', 0.2, true, 'water_cook'),
('加热/烹调', '煮/焯 (Active)', '煮沸', ARRAY['煮沸'], 'cook', 0.1, true, 'water_cook');

-- Category: 炖/焖/煨 (Passive)
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('加热/烹调', '炖/焖/煨 (Passive)', '焖', ARRAY['焖', 'braise'], 'cook', 0.1, true, 'low_heat'),
('加热/烹调', '炖/焖/煨 (Passive)', '焖煮', ARRAY['焖煮'], 'cook', 0.1, true, 'low_heat'),
('加热/烹调', '炖/焖/煨 (Passive)', '盖盖焖', ARRAY['盖盖焖'], 'cook', 0.05, true, 'low_heat'),
('加热/烹调', '炖/焖/煨 (Passive)', '炖', ARRAY['炖', 'stew'], 'cook', 0.1, true, 'low_heat'),
('加热/烹调', '炖/焖/煨 (Passive)', '文火慢炖', ARRAY['文火慢炖'], 'cook', 0.05, true, 'low_heat'),
('加热/烹调', '炖/焖/煨 (Passive)', '隔水炖', ARRAY['隔水炖'], 'cook', 0.05, true, 'low_heat'),
('加热/烹调', '炖/焖/煨 (Passive)', '高压炖', ARRAY['高压炖'], 'cook', 0.05, true, 'pressure_cook'),
('加热/烹调', '炖/焖/煨 (Passive)', '小火煨煮', ARRAY['煨'], 'cook', 0.1, true, 'low_heat'),
('加热/烹调', '炖/焖/煨 (Passive)', '砂锅煨', ARRAY['砂锅煨'], 'cook', 0.1, true, 'low_heat'),
('加热/烹调', '炖/焖/煨 (Passive)', '小火慢煮', ARRAY['慢煮'], 'cook', 0.1, true, 'low_heat');

-- Category: 控温/预热
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('加热/烹调', '控温/预热', '预热锅', ARRAY['预热锅'], 'prep', 0.2, true, 'stove_prep'),
('加热/烹调', '控温/预热', '预热油', ARRAY['预热油'], 'prep', 0.2, true, 'stove_prep'),
('加热/烹调', '控温/预热', '预热烤箱', ARRAY['预热烤箱'], 'prep', 0.1, true, 'oven_prep'),
('加热/烹调', '控温/预热', '开大火', ARRAY['开大火'], 'cook', 0.1, true, 'heat_control'),
('加热/烹调', '控温/预热', '转中火', ARRAY['转中火'], 'cook', 0.1, true, 'heat_control'),
('加热/烹调', '控温/预热', '转小火', ARRAY['转小火'], 'cook', 0.1, true, 'heat_control'),
('加热/烹调', '控温/预热', '关火', ARRAY['关火'], 'cook', 0.1, true, 'heat_control'),
('加热/烹调', '控温/预热', '保温', ARRAY['保温'], 'wait', 0.0, false, null),
('加热/烹调', '控温/预热', '冷却', ARRAY['冷却'], 'wait', 0.0, false, null),
('加热/烹调', '控温/预热', '冰镇', ARRAY['冰镇'], 'wait', 0.0, false, null),
('加热/烹调', '控温/预热', '回温', ARRAY['回温'], 'wait', 0.0, false, null);


-- === [领域: 准备/切配] ===

-- Category: 清洗/处理
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('准备/切配', '清洗/处理', '清洗', ARRAY['清洗', 'wash'], 'prep', 0.7, true, 'washing'),
('准备/切配', '清洗/处理', '冲洗', ARRAY['冲洗'], 'prep', 0.6, true, 'washing'),
('准备/切配', '清洗/处理', '浸泡', ARRAY['浸泡', 'soak'], 'prep', 0.1, true, 'washing'),
('准备/切配', '清洗/处理', '漂洗', ARRAY['漂洗'], 'prep', 0.6, true, 'washing'),
('准备/切配', '清洗/处理', '盐水浸泡', ARRAY['盐水浸泡'], 'prep', 0.1, true, 'washing'),
('准备/切配', '清洗/处理', '挑拣', ARRAY['挑拣'], 'prep', 0.8, true, 'sorting'),
('准备/切配', '清洗/处理', '去根/皮/核', ARRAY['去皮', '去核', 'peel'], 'prep', 0.8, true, 'processing'),
('准备/切配', '清洗/处理', '剔骨/刺', ARRAY['剔骨'], 'prep', 1.0, true, 'processing'),
('准备/切配', '清洗/处理', '去虾线', ARRAY['去虾线'], 'prep', 1.0, true, 'processing');

-- Category: 切工 (Active)
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('准备/切配', '切工 (Active)', '切片', ARRAY['切片', 'slice'], 'prep', 0.9, true, 'cutting'),
('准备/切配', '切工 (Active)', '切丝', ARRAY['切丝', 'shred'], 'prep', 0.9, true, 'cutting'),
('准备/切配', '切工 (Active)', '切丁', ARRAY['切丁', 'dice'], 'prep', 0.9, true, 'cutting'),
('准备/切配', '切工 (Active)', '切块', ARRAY['切块', 'chop'], 'prep', 0.9, true, 'cutting'),
('准备/切配', '切工 (Active)', '剁碎', ARRAY['剁碎', 'mince'], 'prep', 1.0, true, 'cutting'),
('准备/切配', '切工 (Active)', '拍碎', ARRAY['拍碎', 'smash'], 'prep', 0.8, true, 'cutting'),
('准备/切配', '切工 (Active)', '拍松', ARRAY['拍松'], 'prep', 0.8, true, 'cutting'),
('准备/切配', '切工 (Active)', '压扁', ARRAY['压扁'], 'prep', 0.8, true, 'cutting');


-- === [领域: 混合/腌制] ===

-- Category: 混合/搅拌
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('混合/腌制', '混合/搅拌', '搅拌', ARRAY['搅拌', 'mix', 'stir'], 'prep', 0.8, true, 'mixing'),
('混合/腌制', '混合/搅拌', '拌匀', ARRAY['拌匀'], 'prep', 0.8, true, 'mixing'),
('混合/腌制', '混合/搅拌', '打发', ARRAY['打发', 'whip'], 'prep', 1.0, true, 'mixing'),
('混合/腌制', '混合/搅拌', '抓匀', ARRAY['抓匀'], 'prep', 0.8, true, 'mixing');

-- Category: 腌制 (Passive)
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('混合/腌制', '腌制 (Passive)', '腌制', ARRAY['腌', 'marinate'], 'prep', 0.2, true, 'marinating'), -- 注意: 常规腌制通常只是放置，但这里设为 prep 0.2 表示需要准备工作
('混合/腌制', '腌制 (Passive)', '腌渍', ARRAY['腌渍'], 'prep', 0.2, true, 'marinating'),
('混合/腌制', '腌制 (Passive)', '静置腌制', ARRAY['静置'], 'wait', 0.0, false, null),
('混合/腌制', '腌制 (Passive)', '抹盐/糖', ARRAY['抹盐'], 'prep', 0.8, true, 'seasoning');


-- === [领域: 面点/收尾] ===

-- Category: 面团
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('面点/收尾', '面团', '和面', ARRAY['和面', 'knead'], 'prep', 1.0, true, 'dough_work'),
('面点/收尾', '面团', '揉面', ARRAY['揉面'], 'prep', 1.0, true, 'dough_work'),
('面点/收尾', '面团', '醒面', ARRAY['醒面', 'rest'], 'wait', 0.0, false, null),
('面点/收尾', '面团', '发酵', ARRAY['发酵', 'ferment'], 'wait', 0.0, false, null),
('面点/收尾', '面团', '擀面', ARRAY['擀面', 'roll'], 'prep', 1.0, true, 'dough_work'),
('面点/收尾', '面团', '包馅', ARRAY['包馅'], 'prep', 1.0, true, 'dough_work');

-- Category: 保存/冷冻
insert into sys_algorithm_actions (category, subcategory, label, keywords, step_type, default_load, is_active, affinity_group) values
('面点/收尾', '保存/冷冻', '冷藏', ARRAY['冷藏', 'chill'], 'wait', 0.0, false, null),
('面点/收尾', '保存/冷冻', '冷冻', ARRAY['冷冻', 'freeze'], 'wait', 0.0, false, null);

