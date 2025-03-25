export interface Step {
  id: string
  text: string
  completed: boolean
  completedAt?: number
  timeEstimate: number // in minutes
  notes?: string
}

export interface Milestone {
  id: string
  title: string
  completed: boolean
  completedAt?: number
  steps: Step[]
  bonusPoints: number // Points awarded when milestone is completed
}

export interface Goal {
  id: string
  title: string
  purpose: string
  dueDate?: string
  milestones: Milestone[]
  currentPoints: number // Current points accumulated
  totalPoints: number // Total points needed (default 50)
}

