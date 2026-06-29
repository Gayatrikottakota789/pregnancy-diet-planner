'use client'

import { useState, useMemo } from 'react'
import { FOODS } from '@/data'

const dietOptions = [
  { id: 'veg', label: '🌿 Veg', active: 'bg-green-500 border-green-500 text-white' },
  { id: 'non-veg', label: '🍖 Non-Veg', active: 'bg-red-500 border-red-500 text-white' },
  { id: 'egg', label: '🥚 Egg', active: 'bg-amber-500 border-amber-500 text-white' },
  { id: 'vegan', label: '🌱 Vegan', active: 'bg-emerald-500 border-emerald-500 text-white' },
]

const safetyStyles = {
  safe: { badge: 'bg-green-100 text-green-800', label: '✅ Safe', border: 'border-green-500' },
  unsafe: { badge: 'bg-red-100 text-red-800', label: '❌ Avoid', border: 'border-red-500' },
  moderation: { badge: 'bg-amber-100 text-amber-800', label: '⚠️ Limit', border: 'border-amber-500' },
}

const dietBadge = {
  'veg': 'bg-green-100 text-green-800',
  'non-veg': 'bg-red-100 text-red-800',
  'egg': 'bg-amber-100 text-amber-800',
  'vegan': 'bg-emerald-100 text-emerald-800',
}

export default function FoodChecker() {
  const [diet, setDiet] = useState('veg')
  const [search, setSearch] = useState('')
  const [safety, setSafety] = useState('')

  const filtered = useMemo(() => {
    let results = FOODS.filter(f => f.diet_type === diet)
    if (search) results = results.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    if (safety) results = results.filter(f => f.safety === safety)
    return results.sort((a, b) => a.name.localeCompare(b.name))
  }, [diet, search, safety])

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {dietOptions.map(d => (
          <button
            key={d.id}
            onClick={() => setDiet(d.id)}
            className={`px-4 py-2 rounded-full border-[1.5px] text-sm font-medium transition-all ${
              diet === d.id ? d.active : 'bg-white border-gray-200 hover:border-pink-500'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          placeholder="Search food (paneer, spinach, egg...)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 border-[1.5px] border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-pink-500 font-[inherit]"
        />
        <select
          value={safety}
          onChange={e => setSafety(e.target.value)}
          className="px-4 py-2.5 border-[1.5px] border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-pink-500 font-[inherit] min-w-[140px]"
        >
          <option value="">All Safety</option>
          <option value="safe">{'✅'} Safe</option>
          <option value="moderation">{'⚠️'} Moderation</option>
          <option value="unsafe">{'❌'} Unsafe</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">{'🔍'}</div>
          <p className="text-sm">No foods found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(f => {
            const s = safetyStyles[f.safety]
            return (
              <div
                key={f.id}
                className={`bg-white rounded-2xl p-5 border-l-[5px] ${s.border} shadow-sm hover:shadow-lg transition-all`}
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-[17px] font-semibold leading-snug">{f.name}</h3>
                  <span className={`shrink-0 px-2.5 py-0.5 rounded-lg text-xs font-semibold ${s.badge}`}>
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-2 text-xs text-gray-500">
                  <span className={`px-2.5 py-0.5 rounded-lg font-semibold ${dietBadge[f.diet_type]}`}>
                    {f.diet_type}
                  </span>
                  <span>{'·'} {f.category}</span>
                  <span>{'·'} Best: {f.trimester_best === 'all' ? 'All trimesters' : `Trimester ${f.trimester_best}`}</span>
                </div>
                {f.safety_reason && (
                  <p className="text-xs text-red-600 italic mt-2.5 p-2 bg-red-50 rounded-lg">
                    {'⚠️'} {f.safety_reason}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {[
                    { val: f.iron_mg, label: 'Iron (mg)' },
                    { val: f.calcium_mg, label: 'Calcium (mg)' },
                    { val: f.folic_acid_mcg, label: 'Folic (mcg)' },
                    { val: f.protein_g, label: 'Protein (g)' },
                  ].map(n => (
                    <div key={n.label} className="text-center py-2 bg-gray-50 rounded-lg">
                      <div className="text-sm font-semibold text-pink-500">{n.val}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{n.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
