'use client'

import { useState, useEffect, useMemo } from 'react'
import { FOODS, DAILY_RECOMMENDED } from '@/data'
import { getLog, saveLog } from '@/storage'

const nutrientConfig = [
  { key: 'iron_mg', label: 'Iron', unit: 'mg', icon: '🩸', gradient: 'from-pink-500 to-pink-300' },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg', icon: '🦴', gradient: 'from-violet-500 to-violet-300' },
  { key: 'folic_acid_mcg', label: 'Folic Acid', unit: 'mcg', icon: '🌿', gradient: 'from-emerald-500 to-emerald-300' },
  { key: 'protein_g', label: 'Protein', unit: 'g', icon: '💪', gradient: 'from-amber-500 to-amber-300' },
]

const dietOptions = [
  { id: 'veg', label: '🌿 Veg' },
  { id: 'non-veg', label: '🍖 Non-Veg' },
  { id: 'egg', label: '🥚 Egg' },
  { id: 'vegan', label: '🌱 Vegan' },
]

export default function Dashboard() {
  const [entries, setEntries] = useState([])
  const [suggestDiet, setSuggestDiet] = useState('veg')

  useEffect(() => {
    setEntries(getLog())
  }, [])

  const totals = useMemo(() => {
    const t = { iron_mg: 0, calcium_mg: 0, folic_acid_mcg: 0, protein_g: 0 }
    entries.forEach(e => {
      const food = FOODS.find(f => f.id === e.food_id)
      if (food) {
        const ratio = e.quantity_g / 100
        t.iron_mg += food.iron_mg * ratio
        t.calcium_mg += food.calcium_mg * ratio
        t.folic_acid_mcg += food.folic_acid_mcg * ratio
        t.protein_g += food.protein_g * ratio
      }
    })
    return {
      iron_mg: Math.round(t.iron_mg * 100) / 100,
      calcium_mg: Math.round(t.calcium_mg * 100) / 100,
      folic_acid_mcg: Math.round(t.folic_acid_mcg * 100) / 100,
      protein_g: Math.round(t.protein_g * 100) / 100,
    }
  }, [entries])

  const suggestions = useMemo(() => {
    return nutrientConfig
      .map(n => {
        const consumed = totals[n.key]
        const recommended = DAILY_RECOMMENDED[n.key]
        const pct = recommended ? (consumed / recommended) * 100 : 100
        if (pct >= 60) return null

        const topFoods = FOODS
          .filter(f => f.safety !== 'unsafe' && f[n.key] > 2 && f.diet_type === suggestDiet)
          .sort((a, b) => b[n.key] - a[n.key])
          .slice(0, 5)

        return {
          ...n,
          consumed,
          recommended,
          pct: Math.round(pct * 10) / 10,
          deficit: Math.round((recommended - consumed) * 100) / 100,
          foods: topFoods,
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.pct - b.pct)
  }, [totals, suggestDiet])

  function quickLog(food) {
    if (!confirm(`Log 100g of ${food.name}?`)) return
    setEntries(prev => {
      const updated = [...prev, { id: Date.now(), food_id: food.id, quantity_g: 100, meal_type: 'snack' }]
      saveLog(updated)
      return updated
    })
  }

  return (
    <div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="font-semibold text-sm mb-1">Today&apos;s Nutrition Progress</div>
        <div className="text-xs text-gray-500 mb-4">Recommended daily intake for pregnant women</div>

        <div className="space-y-4">
          {nutrientConfig.map(n => {
            const consumed = totals[n.key]
            const recommended = DAILY_RECOMMENDED[n.key]
            const pct = Math.min(Math.round((consumed / recommended) * 1000) / 10, 100)
            return (
              <div key={n.key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{n.icon} {n.label}</span>
                  <span className="text-gray-500">{consumed} / {recommended} {n.unit} ({pct}%)</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${n.gradient} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-red-500">
        <div className="font-semibold text-sm mb-1">{'💡'} What should you eat next?</div>
        <div className="text-xs text-gray-500 mb-3">Based on your nutrient gaps today</div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {dietOptions.map(d => (
            <button
              key={d.id}
              onClick={() => setSuggestDiet(d.id)}
              className={`px-3.5 py-1.5 rounded-2xl border-[1.5px] text-xs font-medium transition-all ${
                suggestDiet === d.id
                  ? 'bg-pink-500 border-pink-500 text-white'
                  : 'bg-white border-gray-200 hover:border-pink-500'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {suggestions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-2">{'🎉'}</div>
            <h3 className="font-semibold text-green-800 mb-1">Great job!</h3>
            <p className="text-sm text-gray-500">You&apos;re meeting your nutrient targets for today. Keep it up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map(s => (
              <div key={s.key} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-red-400">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 mb-2">
                  <span className="font-semibold text-[15px]">{'🔴'} {s.label} is low</span>
                  <span className="text-xs bg-red-100 text-red-800 px-2.5 py-0.5 rounded-lg font-semibold w-fit">
                    Need {s.deficit} {s.unit} more {'·'} {s.pct}% done
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">Top foods rich in {s.label} (per 100g):</div>
                <div className="flex flex-wrap gap-2">
                  {s.foods.length > 0 ? s.foods.map(f => (
                    <button
                      key={f.id}
                      onClick={() => quickLog(f)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-pink-50 rounded-xl text-sm border-[1.5px] border-pink-100 hover:border-pink-500 hover:bg-pink-100 transition-all"
                    >
                      <span className="font-medium">{f.name}</span>
                      <span className="text-pink-500 font-semibold text-xs">{f[s.key]} {s.unit}</span>
                    </button>
                  )) : (
                    <span className="text-sm text-gray-400">No matching foods for this diet type</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
