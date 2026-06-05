// FILE: lib/weekId.ts
import { format, getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, parseISO } from 'date-fns'

export function getCurrentWeekId(): string {
  return getWeekIdForDate(new Date())
}

export function getWeekIdForDate(date: Date): string {
  const week = getISOWeek(date)
  const year = getISOWeekYear(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function getWeekRange(weekId: string): { monday: Date; sunday: Date } {
  // Parse "YYYY-WXX" — construct a date in that ISO week
  const match = weekId.match(/^(\d{4})-W(\d{2})$/)
  if (!match) throw new Error(`Invalid weekId: ${weekId}`)

  const year = parseInt(match[1], 10)
  const week = parseInt(match[2], 10)

  // Jan 4 is always in week 1 of its ISO year — use it as anchor
  const jan4 = new Date(year, 0, 4)
  const jan4Week = getISOWeek(jan4)
  const jan4Monday = startOfISOWeek(jan4)

  const monday = new Date(jan4Monday)
  monday.setDate(jan4Monday.getDate() + (week - jan4Week) * 7)

  const sunday = endOfISOWeek(monday)

  return { monday, sunday }
}

export function formatWeekLabel(weekId: string): string {
  const { monday, sunday } = getWeekRange(weekId)
  return `${format(monday, 'MMM d')} – ${format(sunday, 'MMM d, yyyy')}`
}
