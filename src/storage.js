function getTodayKey() {
  return new Date().toISOString().split('T')[0]
}

export function getLog() {
  if (typeof window === 'undefined') return []
  try {
    const all = JSON.parse(localStorage.getItem('pregnancy_diet_log') || '{}')
    return all[getTodayKey()] || []
  } catch {
    return []
  }
}

export function saveLog(entries) {
  if (typeof window === 'undefined') return
  try {
    const all = JSON.parse(localStorage.getItem('pregnancy_diet_log') || '{}')
    all[getTodayKey()] = entries
    localStorage.setItem('pregnancy_diet_log', JSON.stringify(all))
  } catch {}
}
