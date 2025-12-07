"use client"

import { useState } from "react"
import { createAction, deleteAction, updateCategory } from "./actions"
import { Trash2, Plus, Save, Activity, Layers, Tag, Settings, Sliders } from "lucide-react"

export function AdminDashboardClient({ initialActions, initialCategories }: any) {
  const [activeTab, setActiveTab] = useState("actions")

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-lg shadow-sm border border-slate-200 mb-8 w-fit">
        <button
          onClick={() => setActiveTab("actions")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-bold transition-all ${
            activeTab === "actions" 
              ? "bg-slate-900 text-white shadow-md" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Activity className="h-4 w-4" />
          动作定义 (Actions)
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-bold transition-all ${
            activeTab === "categories" 
              ? "bg-slate-900 text-white shadow-md" 
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Layers className="h-4 w-4" />
          菜品分类 (Categories)
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "actions" ? (
          <ActionsPanel actions={initialActions} />
        ) : (
          <CategoriesPanel categories={initialCategories} />
        )}
      </div>
    </div>
  )
}

// === Sub Components ===

function ActionsPanel({ actions }: { actions: any[] }) {
  const [isCreating, setIsCreating] = useState(false)

  // Group by type
  const grouped = actions.reduce((acc: any, curr: any) => {
    (acc[curr.step_type] = acc[curr.step_type] || []).push(curr)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List Column */}
      <div className="lg:col-span-2 space-y-8">
        {Object.entries(grouped).map(([type, items]: [string, any]) => (
          <div key={type} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm flex items-center gap-2">
                <Tag className="h-4 w-4 text-slate-400" />
                TYPE: {type}
              </h3>
              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                {items.length} items
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {items.map((action: any) => (
                <div key={action.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-slate-900">{action.label}</span>
                      {action.is_active ? (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 font-bold">ACTIVE</span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-bold">PASSIVE</span>
                      )}
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-mono">
                        LOAD: {action.default_load}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      KEYS: [{action.keywords.join(", ")}]
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      if (confirm("Delete this action definition?")) {
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

      {/* Create Form Column */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 sticky top-24">
          <div className="flex items-center gap-2 mb-6 text-slate-900">
             <Plus className="h-5 w-5 text-cyan-600" />
             <h2 className="font-bold">Define New Action</h2>
          </div>
          
          <form action={createAction} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Label</label>
              <input name="label" required placeholder="e.g. 慢炖" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Keywords (Comma separated)</label>
              <input name="keywords" required placeholder="e.g. 炖, simmer, stew" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500 transition-colors" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                <select name="step_type" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500">
                  <option value="prep">Prep (备菜)</option>
                  <option value="cook">Cook (烹饪)</option>
                  <option value="wait">Wait (等待)</option>
                  <option value="serve">Serve (装盘)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Load</label>
                <input name="default_load" type="number" step="0.1" max="1.0" min="0" defaultValue="1.0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500" />
              </div>
            </div>

            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Affinity Group (Optional)</label>
               <input name="affinity_group" placeholder="e.g. cutting" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-cyan-500" />
               <p className="text-[10px] text-slate-400 mt-1">Actions with same group will be merged in prep.</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" name="is_active" id="is_active" defaultChecked className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">Requires Active Attention?</label>
            </div>

            <button className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
              <Save className="h-4 w-4" />
              Save Definition
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function CategoriesPanel({ categories }: { categories: any[] }) {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Sliders className="h-5 w-5 text-cyan-600" />
                        Scheduling Priorities
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        High priority items are scheduled first. Offset determines relation to meal time (0 = serve at meal time).
                    </p>
                </div>
                
                <div className="divide-y divide-slate-100">
                    {categories.map((cat: any) => (
                        <form key={cat.id} action={updateCategory.bind(null, cat.id)} className="p-6 hover:bg-slate-50 transition-colors grid grid-cols-12 gap-6 items-center">
                            {/* Label */}
                            <div className="col-span-4">
                                <div className="font-bold text-slate-900 text-lg">{cat.label}</div>
                                <div className="text-xs text-slate-400 font-mono">slug: {cat.slug}</div>
                            </div>

                            {/* Controls */}
                            <div className="col-span-6 grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Priority (1-10)</label>
                                    <input 
                                        name="priority" 
                                        type="number" 
                                        defaultValue={cat.schedule_priority}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-mono focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Offset (Sec)</label>
                                    <input 
                                        name="offset" 
                                        type="number" 
                                        defaultValue={cat.end_time_offset}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-mono focus:border-cyan-500 focus:outline-none"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-0.5 text-right">
                                        {Math.round(cat.end_time_offset / 60)} mins
                                    </p>
                                </div>
                            </div>

                            {/* Action */}
                            <div className="col-span-2 text-right">
                                <button className="p-2 bg-slate-200 hover:bg-cyan-500 hover:text-white text-slate-600 rounded transition-colors" title="Update">
                                    <Save className="h-5 w-5" />
                                </button>
                            </div>
                        </form>
                    ))}
                </div>
            </div>
        </div>
    )
}

