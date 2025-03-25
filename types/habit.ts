import type { Goal } from "./step"

export interface Habit {
  id: string
  title: string
  description?: string
  goalIds: string[] // Array of goal IDs this habit is associated with
  completions: HabitCompletion[]
  createdAt: number
  pointValue: number // Points contributed per completion (default 0.25)
}

export interface HabitCompletion {
  date: string // ISO date string (YYYY-MM-DD)
  timestamp: number // Unix timestamp of completion
}

export interface HabitWithGoals extends Habit {
  goals: Goal[] // Populated goals this habit is associated with
}

