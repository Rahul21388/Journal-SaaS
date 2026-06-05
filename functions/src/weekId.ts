// Standalone copy of lib/weekId.ts — functions package cannot import from Next.js lib/

export function getCurrentWeekId(): string {
  return getWeekIdForDate(new Date())
}

export function getWeekIdForDate(date: Date): string {
  const week = getISOWeek(date)
  const year = getISOWeekYear(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function getWeekRange(weekId: string): { monday: Date; sunday: Date } {
  const match = weekId.match(/^(\d{4})-W(\d{2})$/)
  if (!match) throw new Error(`Invalid weekId: ${weekId}`)

  const year = parseInt(match[1], 10)
  const week = parseInt(match[2], 10)

  // ISO week: week 1 contains Jan 4. Use it as anchor.
  const jan4 = new Date(year, 0, 4)
  const jan4Week = getISOWeek(jan4)
  const jan4Monday = startOfISOWeek(jan4)

  const monday = new Date(jan4Monday)
  monday.setDate(jan4Monday.getDate() + (week - jan4Week) * 7)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return { monday, sunday }
}

export function formatDateYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ── ISO week helpers (no date-fns in functions to keep bundle small) ─────────

function startOfISOWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  // Monday = 0 offset, Sunday = 6 offset
  const diff = (day === 0 ? -6 : 1 - day)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getISOWeek(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // Thursday of current week
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return (
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  )
}

function getISOWeekYear(date: Date): number {
  const d = new Date(date)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  return d.getFullYear()
}
