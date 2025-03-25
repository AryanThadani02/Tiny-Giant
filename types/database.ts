export type DbGoal = {
  id: string
  title: string
  purpose: string
  due_date: string | null
  created_at: string
  updated_at: string
  estimated_score?: number // Make this optional
}

export type DbStep = {
  id: string
  goal_id: string
  text: string
  completed: boolean
  completed_at: string | null
  time_estimate: number
  notes: string | null
  created_at: string
  updated_at: string
}

