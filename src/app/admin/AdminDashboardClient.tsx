"use client"

import { useState } from "react"
import { createAction, deleteAction, createCategory, updateCategory, deleteCategory, createMetadata, deleteMetadata } from "./actions"
import { Trash2, Plus, Save, Activity, Layers, Tag, Settings, Sliders, Database, ChefHat, Scale, BarChart } from "lucide-react"

export function AdminDashboardClient({ 
    initialActions, 
    initialCategories, 
    initialUnits, 
    initialCuisines, 
    initialDifficulties 
}: any) {
  const [activeTab, setActiveTab] = useState("actions")

  const tabs = [
    { id: "actions", label: "行动定义 (Actions)", icon: Activity },
    { id: "categories", label: "菜品分类 (Categories)", icon: Layers },
    { id: "metadata", label: "基础元数据 (Metadata)", icon: Database },
  ]

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-200 mb-8 w-fit">
        {tabs.map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-bold transition-all ${
                    activeTab === tab.id
                    ? "bg-slate-900 text-white shadow-md" 
                    : "text-slate-500 hover:bg-slate-50"
                }`}
            >
                <tab.icon className="h-4 w-4" />
                {tab.label}
            </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "actions" && <ActionsPanel actions={initialActions} />}
        {activeTab === "categories" && <CategoriesPanel categories={initialCategories} />}
        {activeTab === "metadata" && (
            <MetadataPanel 
                units={initialUnits} 
                cuisines={initialCuisines} 
                difficulties={initialDifficulties} 
            />
        )}
      </div>
    </div>
  )
}

// === Actions Panel (Granular) ===

function ActionsPanel({ actions }: { actions: any[] }) {
  // Group by Category -> SubCategory
  const grouped = actions.reduce((acc: any, curr: any) => {
    if (!acc[curr.category]) acc[curr.category] = {}
    const sub = curr.subcategory || '其他'
    if (!acc[curr.category][sub]) acc[curr.category][sub] = []
    acc[curr.category][sub].push(curr)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List Column */}
      <div className="lg:col-span-2 space-y-8">
        {Object.entries(grouped).map(([category, subGroups]: [string, any]) => (
          <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-700 text-lg flex items-center gap-2">
                <Tag className="h-5 w-5 text-cyan-600" />
                {category}
              </h3>
            </div>
            
            <div className="p-4 space-y-4">
                {Object.entries(subGroups).map(([sub, items]: [string, any]) => (
                    <div key={sub} className="border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-2 px-1">{sub}</div>
                        <div className="space-y-1">
                            {items.map((action: any) => (
                                <div key={action.id} className="bg-white p-3 rounded border border-slate-200 hover:border-cyan-200 transition-colors flex items-center justify-between group shadow-sm">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-slate-800">{action.label}</span>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                                                action.step_type === 'prep' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                action.step_type === 'cook' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                action.step_type === 'wait' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                                'bg-purple-50 text-purple-600 border-purple-100'
                                            }`}>
                                                {action.step_type.toUpperCase()}
                                            </span>
                                            {action.is_active ? (
                                                <span className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-bold">主动</span>
                                            ) : (
                                                <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 font-bold">被动</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>关键词: [{action.keywords.join(", ")}]</span>
                                            <span className="font-mono text-cyan-600">负载: {action.default_load}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (confirm(`确定要删除动作 "${action.label}" 吗?`)) {
                                                deleteAction(action.id)
                                            }
                                        }}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Form Column */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sticky top-24">
          <div className="flex items-center gap-2 mb-6 text-slate-900">
             <Plus className="h-5 w-5 text-cyan-600" />
             <h2 className="font-bold">定义新动作</h2>
          </div>
          
          <form action={async (formData) => { await createAction(null, formData) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">大类 (Category)</label>
                    <input name="category" required placeholder="如: 加热" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">子类 (Sub)</label>
                    <input name="subcategory" placeholder="如: 炒" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">动作名称 (Label)</label>
              <input name="label" required placeholder="如: 爆炒" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">匹配关键词 (逗号分隔)</label>
              <input name="keywords" required placeholder="如: 爆炒, stir-fry" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">算法类型</label>
                <select name="step_type" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500">
                  <option value="prep">备菜 (Prep)</option>
                  <option value="cook">烹饪 (Cook)</option>
                  <option value="wait">等待 (Wait)</option>
                  <option value="serve">装盘 (Serve)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">默认负载 (0-1)</label>
                <input name="default_load" type="number" step="0.1" max="1.0" min="0" defaultValue="1.0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500" />
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">亲和力分组 (可选)</label>
               <input name="affinity_group" placeholder="如: high_heat" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500" />
               <p className="text-[10px] text-slate-400 mt-1">相同分组的连续任务会被算法偏好聚合</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" name="is_active" id="is_active" defaultChecked className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">需要人手持续参与 (Active)</label>
            </div>

            <button className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <Save className="h-4 w-4" />
              保存定义
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function CategoriesPanel({ categories }: { categories: any[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <Sliders className="h-5 w-5 text-cyan-600" />
                            调度优先级配置
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            高优先级菜品先排课。时间偏移量决定了相对于“开饭时间”的提前量 (0 = 准点上菜)。
                        </p>
                    </div>
                    
                    <div className="divide-y divide-slate-100">
                        {categories.map((cat: any) => (
                            <form 
                                key={cat.id} 
                                action={async (formData) => { await updateCategory(cat.id, formData) }} 
                                className="p-6 hover:bg-slate-50 transition-colors grid grid-cols-12 gap-6 items-center group"
                            >
                                {/* Label */}
                                <div className="col-span-4">
                                    <div className="font-bold text-slate-900 text-lg">{cat.label}</div>
                                    <div className="text-xs text-slate-400 font-mono">ID: {cat.slug}</div>
                                </div>

                                {/* Controls */}
                                <div className="col-span-6 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">优先级 (1-10)</label>
                                        <input 
                                            name="priority" 
                                            type="number" 
                                            defaultValue={cat.schedule_priority}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-mono focus:border-cyan-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">偏移 (秒)</label>
                                        <input 
                                            name="offset" 
                                            type="number" 
                                            defaultValue={cat.end_time_offset}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-mono focus:border-cyan-500 focus:outline-none"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-0.5 text-right">
                                            {Math.round(cat.end_time_offset / 60)} 分钟
                                        </p>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="col-span-2 text-right flex gap-2 justify-end">
                                    <button className="p-2 bg-slate-100 hover:bg-cyan-500 hover:text-white text-slate-600 rounded transition-colors" title="保存修改">
                                        <Save className="h-4 w-4" />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            if (confirm(`确定要删除分类 "${cat.label}" 吗?`)) {
                                                deleteCategory(cat.id)
                                            }
                                        }}
                                        className="p-2 bg-slate-100 hover:bg-red-500 hover:text-white text-slate-400 rounded transition-colors opacity-0 group-hover:opacity-100" 
                                        title="删除"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sticky top-24">
                    <div className="flex items-center gap-2 mb-6 text-slate-900">
                        <Plus className="h-5 w-5 text-cyan-600" />
                        <h2 className="font-bold">新增分类</h2>
                    </div>
                    <form action={async (formData) => { await createCategory(null, formData) }} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">分类名称</label>
                            <input name="label" required placeholder="如: 甜点" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Slug ID</label>
                            <input name="slug" required placeholder="如: dessert" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">优先级</label>
                                <input name="priority" type="number" defaultValue="1" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">偏移 (秒)</label>
                                <input name="offset" type="number" defaultValue="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
                            </div>
                        </div>
                        <button className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                            <Save className="h-4 w-4" />
                            创建分类
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

function MetadataPanel({ units, cuisines, difficulties }: any) {
    return (
        <div className="space-y-8">
            {/* Units */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Scale className="h-5 w-5 text-cyan-600" />
                        计量单位 (Units)
                    </h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                    {units.map((u: any) => (
                        <div key={u.id} className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full text-sm font-medium border border-slate-200 flex items-center gap-2 group">
                            {u.label}
                            <span className="text-[10px] text-slate-400 uppercase border-l border-slate-300 pl-2 ml-1">{u.type}</span>
                            <button 
                                onClick={() => { if(confirm("删除此单位?")) deleteMetadata('unit', u.id) }}
                                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
                <form action={async (formData) => { await createMetadata('unit', null, formData) }} className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg">
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">单位名称</label>
                        <input name="label" required placeholder="如: 汤匙" className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm" />
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">类型</label>
                        <select name="type" className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm">
                            <option value="mass">重量 (Mass)</option>
                            <option value="volume">体积 (Volume)</option>
                            <option value="count">数量 (Count)</option>
                            <option value="vague">模糊 (Vague)</option>
                        </select>
                    </div>
                    <button className="bg-slate-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-slate-800">添加</button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cuisines */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-6">
                        <ChefHat className="h-5 w-5 text-cyan-600" />
                        菜系 (Cuisines)
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {cuisines.map((c: any) => (
                            <div key={c.id} className="bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-lg text-sm font-bold border border-cyan-100 flex items-center gap-2 group">
                                {c.label}
                                <button 
                                    onClick={() => { if(confirm("删除此菜系?")) deleteMetadata('cuisine', c.id) }}
                                    className="text-cyan-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <form action={async (formData) => { await createMetadata('cuisine', null, formData) }} className="flex gap-2">
                        <input name="label" required placeholder="如: 淮扬菜" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm" />
                        <button className="bg-slate-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-slate-800">添加</button>
                    </form>
                </div>

                {/* Difficulty */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-6">
                        <BarChart className="h-5 w-5 text-cyan-600" />
                        难度等级 (Difficulty)
                    </h3>
                    <div className="space-y-2 mb-6">
                        {difficulties.map((d: any) => (
                            <div key={d.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 group">
                                <span className="text-sm font-bold text-slate-700">{d.label}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs font-mono text-slate-400">LV.{d.level_value}</span>
                                    <button 
                                        onClick={() => { if(confirm("删除此难度?")) deleteMetadata('difficulty', d.id) }}
                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form action={async (formData) => { await createMetadata('difficulty', null, formData) }} className="flex gap-2">
                        <input name="label" required placeholder="如: 地狱级" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm" />
                        <input name="level" type="number" placeholder="Lv" className="w-16 px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm" />
                        <button className="bg-slate-900 text-white px-4 py-2 rounded text-sm font-bold hover:bg-slate-800">添加</button>
                    </form>
                </div>
            </div>
        </div>
    )
}
