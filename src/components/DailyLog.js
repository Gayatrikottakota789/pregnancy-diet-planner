'use client'

import { useState, useEffect, useRef } from 'react'
import { FOODS } from '@/data'
import { getLog, saveLog } from '@/storage'

export default function DailyLog() {
  const [entries, setEntries] = useState([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedFood, setSelectedFood] = useState(null)
  const [quantity, setQuantity] = useState(100)
  const [mealType, setMealType] = useState('breakfast')
  const dropdownRef = useRef(null)

  useEffect(() => {
    setEntries(getLog())
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const matches = search.length >= 2
    ? FOODS.filter(f => f.safety !== 'unsafe' && f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : []

  function selectFood(food) {
    setSelectedFood(food)
    setSearch(food.name)
    setShowDropdown(false)
  }

  function addEntry() {
    if (!selectedFood) { alert('Please select a food item first'); return }
    if (!quantity || quantity <= 0) { alert('Please enter a valid quantity'); return }

    setEntries(prev => {
      const updated = [...prev, {
        id: Date.now(),
        food_id: selectedFood.id,
        quantity_g: quantity,
        meal_type: mealType,
      }]
      saveLog(updated)
      return updated
    })
    setSearch('')
    setSelectedFood(null)
    setQuantity(100)
  }

  function deleteEntry(id) {
    setEntries(prev => {
      const updated = prev.filter(e => e.id !== id)
      saveLog(updated)
      return updated
    })
  }

  return (
    <div>
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm mb-4">
        <h3 className="font-semibold text-[15px] mb-3">{'➕'} Log what you ate</h3>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
          <div className="flex-1 relative" ref={dropdownRef}>
            <label className="text-xs text-gray-500 font-medium block mb-1">Food</label>
            <input
              type="text"
              placeholder="Type to search..."
              value={search}
              onChange={e => { setSearch(e.target.value); setShowDropdown(true); setSelectedFood(null) }}
              onFocus={() => search.length >= 2 && setShowDropdown(true)}
              className="w-full px-3 py-2 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-pink-500"
              autoComplete="off"
            />
            {showDropdown && matches.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg max-h-[200px] overflow-y-auto z-20 shadow-lg">
                {matches.map(f => (
                  <div
                    key={f.id}
                    onClick={() => selectFood(f)}
                    className="px-3 py-2.5 cursor-pointer text-sm border-b border-gray-50 last:border-0 hover:bg-pink-50"
                  >
                    {f.name} <span className="text-gray-400 text-xs">({f.diet_type})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="w-full sm:w-24">
            <label className="text-xs text-gray-500 font-medium block mb-1">Qty (g)</label>
            <input
              type="number"
              value={quantity}
              onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-pink-500"
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="text-xs text-gray-500 font-medium block mb-1">Meal</label>
            <select
              value={mealType}
              onChange={e => setMealType(e.target.value)}
              className="w-full px-3 py-2 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-pink-500"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="snack">Snack</option>
              <option value="dinner">Dinner</option>
            </select>
          </div>
          <button
            onClick={addEntry}
            className="px-5 py-2 bg-pink-500 text-white rounded-xl text-sm font-semibold hover:bg-pink-600 transition-all shrink-0"
          >
            Add
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-[15px] mb-2.5">Today&apos;s Log</h3>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-5xl mb-3">{'📝'}</div>
          <p className="text-sm">No food logged today. Start by adding what you ate!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map(e => {
            const food = FOODS.find(f => f.id === e.food_id)
            const ratio = e.quantity_g / 100
            return (
              <div key={e.id} className="flex justify-between items-center bg-white rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex-1 min-w-0 mr-2">
                  <div className="font-semibold text-sm truncate">{food?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {e.quantity_g}g {'·'} {e.meal_type}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Iron: {(food ? food.iron_mg * ratio : 0).toFixed(1)}mg {'·'}{' '}
                    Ca: {(food ? food.calcium_mg * ratio : 0).toFixed(1)}mg {'·'}{' '}
                    Folic: {(food ? food.folic_acid_mcg * ratio : 0).toFixed(1)}mcg {'·'}{' '}
                    Protein: {(food ? food.protein_g * ratio : 0).toFixed(1)}g
                  </div>
                </div>
                <button
                  onClick={() => deleteEntry(e.id)}
                  className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-all shrink-0"
                >
                  {'🗑'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
