'use client'

import { useState, useMemo } from 'react'
import { MEALS } from '@/data'

const dietOptions = [
  { id: 'veg', label: '🌿 Veg', active: 'bg-green-500 border-green-500 text-white' },
  { id: 'non-veg', label: '🍖 Non-Veg', active: 'bg-red-500 border-red-500 text-white' },
  { id: 'egg', label: '🥚 Egg', active: 'bg-amber-500 border-amber-500 text-white' },
  { id: 'vegan', label: '🌱 Vegan', active: 'bg-emerald-500 border-emerald-500 text-white' },
]

const mealIcons = {
  breakfast: '🍳',
  lunch: '🍛',
  snack: '🍏',
  dinner: '🌙',
}

const mealOrder = ['breakfast', 'lunch', 'snack', 'dinner']

export default function MealPlans() {
  const [diet, setDiet] = useState('veg')
  const [trimester, setTrimester] = useState('')

  const grouped = useMemo(() => {
    let results = MEALS.filter(m => m.diet_type === diet)
    if (trimester) results = results.filter(m => m.trimester === trimester || m.trimester === 'all')

    const groups = {}
    results.forEach(m => {
      if (!groups[m.meal_type]) groups[m.meal_type] = []
      groups[m.meal_type].push(m)
    })
    return groups
  }, [diet, trimester])

  const hasResults = mealOrder.some(t => grouped[t])

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

      <select
        value={trimester}
        onChange={e => setTrimester(e.target.value)}
        className="w-full sm:w-auto px-4 py-2.5 border-[1.5px] border-gray-200 rounded-xl text-sm bg-white outline-none focus:border-pink-500 font-[inherit] mb-4"
      >
        <option value="">All Trimesters</option>
        <option value="1">1st Trimester (Week 1-12)</option>
        <option value="2">2nd Trimester (Week 13-26)</option>
        <option value="3">3rd Trimester (Week 27-40)</option>
      </select>

      {!hasResults ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">{'🍲'}</div>
          <p className="text-sm">No meal plans found for this selection.</p>
        </div>
      ) : (
        mealOrder.map(type =>
          grouped[type] ? (
            <div key={type}>
              <h3 className="text-base font-semibold my-3 py-2.5 px-4 bg-white rounded-xl border-l-4 border-pink-500">
                {mealIcons[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
              </h3>
              {grouped[type].map(m => (
                <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm mb-2.5">
                  <div className="font-semibold text-[15px]">{m.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{m.description}</div>
                  <div className="text-xs text-gray-400 mt-1.5">
                    <span className="text-pink-500 font-medium">Ingredients:</span> {m.ingredients}
                  </div>
                </div>
              ))}
            </div>
          ) : null
        )
      )}
    </div>
  )
}
