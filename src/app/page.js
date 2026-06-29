'use client'

import { useState } from 'react'
import FoodChecker from '@/components/FoodChecker'
import MealPlans from '@/components/MealPlans'
import DailyLog from '@/components/DailyLog'
import Dashboard from '@/components/Dashboard'

const tabs = [
  { id: 'foods', label: 'Food Checker', icon: '🍎' },
  { id: 'meals', label: 'Meal Plans', icon: '🍲' },
  { id: 'log', label: 'Daily Log', icon: '📝' },
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState('foods')

  return (
    <main>
      <div className="bg-gradient-to-r from-pink-500 via-pink-400 to-orange-400 text-white py-5 px-6 text-center">
        <h1 className="text-xl md:text-2xl font-bold">{'🌱'} Pregnancy Diet Planner</h1>
        <p className="text-sm opacity-90 mt-1">Eat right for you and your baby</p>
      </div>

      <div className="flex sticky top-0 z-10 bg-white border-b-2 border-purple-100 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-2 text-center text-xs sm:text-sm font-medium transition-all min-w-[80px] whitespace-nowrap border-b-[3px] ${
              activeTab === tab.id
                ? 'text-pink-500 border-pink-500 bg-pink-50'
                : 'text-gray-400 border-transparent hover:text-pink-500'
            }`}
          >
            <span className="text-lg sm:text-xl block mb-0.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-4xl mx-auto p-3 sm:p-4">
        {activeTab === 'foods' && <FoodChecker />}
        {activeTab === 'meals' && <MealPlans />}
        {activeTab === 'log' && <DailyLog />}
        {activeTab === 'dashboard' && <Dashboard />}
      </div>
    </main>
  )
}
