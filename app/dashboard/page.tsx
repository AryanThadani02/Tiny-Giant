"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Plus } from "lucide-react"
import { AddGoalDialog } from "@/components/add-goal-dialog"
import { CompactGoalCard } from "@/components/compact-goal-card"
import { ExpandedGoalView } from "@/components/expanded-goal-view"
import type { Goal, Step } from "@/types/step"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { supabase } from "@/lib/supabase"
import type { DbGoal, DbStep } from "@/types/database"

// Define goal colors
const GOAL_COLORS = [
  "#4F6BF4", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EC4899", // Pink
  "#8B5CF6", // Purple
]

// Convert database goal to app goal
const convertDbGoalToGoal = (dbGoal: DbGoal, dbSteps: DbStep[]): Goal => {
  return {
    id: dbGoal.id,
    title: dbGoal.title,
    purpose: dbGoal.purpose || "",
    dueDate: dbGoal.due_date || undefined,
    steps: dbSteps.map(convertDbStepToStep),
    // Handle the case where estimated_score might not exist in the database
    estimatedScore: dbGoal.estimated_score !== undefined ? dbGoal.estimated_score : 0,
  }
}

// Convert database step to app step
const convertDbStepToStep = (dbStep: DbStep): Step => {
  return {
    id: dbStep.id,
    text: dbStep.text,
    completed: dbStep.completed,
    completedAt: dbStep.completed_at ? new Date(dbStep.completed_at).getTime() : undefined,
    timeEstimate: dbStep.time_estimate,
    notes: dbStep.notes || "",
  }
}

export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null)
  const [isGeneratingStep, setIsGeneratingStep] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch goals from the database
  const fetchGoals = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/goals")

      if (!response.ok) {
        throw new Error("Failed to fetch goals")
      }

      const data = await response.json()

      // Convert database goals to app goals
      const appGoals = data.goals.map((dbGoal: any) => convertDbGoalToGoal(dbGoal, dbGoal.steps || []))

      setGoals(appGoals)
    } catch (error: any) {
      console.error("Error fetching goals:", error)
      setError(error.message || "Failed to load goals")
    } finally {
      setIsLoading(false)
    }
  }

  // Load goals on initial render
  useEffect(() => {
    fetchGoals()

    // Set up real-time subscription for goals
    const goalsSubscription = supabase
      .channel("goals-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goals",
        },
        () => {
          fetchGoals()
        },
      )
      .subscribe()

    // Set up real-time subscription for steps
    const stepsSubscription = supabase
      .channel("steps-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "steps",
        },
        () => {
          fetchGoals()
        },
      )
      .subscribe()

    return () => {
      goalsSubscription.unsubscribe()
      stepsSubscription.unsubscribe()
    }
  }, [])

  const handleAddGoal = async (goal: Goal) => {
    try {
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: goal.title,
          purpose: goal.purpose,
          dueDate: goal.dueDate,
          estimatedScore: goal.estimatedScore || 0,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create goal")
      }

      // The goal will be added via the real-time subscription
    } catch (error: any) {
      console.error("Error adding goal:", error)
      setError(error.message || "Failed to add goal")
    }
  }

  const handleStepToggle = async (goalId: string, stepId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/steps/${stepId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update step")
      }

      // The step will be updated via the real-time subscription
    } catch (error: any) {
      console.error("Error updating step:", error)
      setError(error.message || "Failed to update step")
    }
  }

  const handleGenerateNextStep = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    setIsGeneratingStep(true)

    try {
      const response = await fetch("/api/generate-next-step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: goal.title,
          purpose: goal.purpose,
          dueDate: goal.dueDate,
          steps: goal.steps,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate next step")

      const data = await response.json()

      if (data.nextStep) {
        // Add the generated step to the database
        const stepResponse = await fetch("/api/steps", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goalId,
            text: data.nextStep,
            timeEstimate: data.timeEstimate || 60,
          }),
        })

        if (!stepResponse.ok) {
          throw new Error("Failed to save generated step")
        }

        // The step will be added via the real-time subscription
      }
    } catch (error: any) {
      console.error("Error generating next step:", error)
      setError(error.message || "Failed to generate next step")
    } finally {
      setIsGeneratingStep(false)
    }
  }

  const handleAddEmptyStep = async (goalId: string) => {
    try {
      const response = await fetch("/api/steps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalId,
          text: "",
          timeEstimate: 30,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add step")
      }

      // The step will be added via the real-time subscription
    } catch (error: any) {
      console.error("Error adding step:", error)
      setError(error.message || "Failed to add step")
    }
  }

  const handleStepDelete = async (goalId: string, stepId: string) => {
    try {
      const response = await fetch(`/api/steps/${stepId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete step")
      }

      // The step will be deleted via the real-time subscription
    } catch (error: any) {
      console.error("Error deleting step:", error)
      setError(error.message || "Failed to delete step")
    }
  }

  const handleStepUpdate = async (goalId: string, stepId: string, text: string, timeEstimate: number) => {
    try {
      const response = await fetch(`/api/steps/${stepId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          timeEstimate,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update step")
      }

      // The step will be updated via the real-time subscription
    } catch (error: any) {
      console.error("Error updating step:", error)
      setError(error.message || "Failed to update step")
    }
  }

  const handleStepNotesUpdate = async (goalId: string, stepId: string, notes: string) => {
    try {
      const response = await fetch(`/api/steps/${stepId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update step notes")
      }

      // The step will be updated via the real-time subscription
    } catch (error: any) {
      console.error("Error updating step notes:", error)
      setError(error.message || "Failed to update step notes")
    }
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoalToDelete(goalId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteGoal = async () => {
    if (goalToDelete) {
      try {
        const response = await fetch(`/api/goals/${goalToDelete}`, {
          method: "DELETE",
        })

        if (!response.ok) {
          throw new Error("Failed to delete goal")
        }

        // The goal will be deleted via the real-time subscription
        setSelectedGoalId(null)
      } catch (error: any) {
        console.error("Error deleting goal:", error)
        setError(error.message || "Failed to delete goal")
      } finally {
        setGoalToDelete(null)
        setDeleteDialogOpen(false)
      }
    }
  }

  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your Goals</h1>
          <Button className="bg-[#4F6BF4] hover:bg-[#4059CF]" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Goal
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading your goals...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchGoals}>
              Try Again
            </Button>
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">You haven't added any goals yet.</p>
            <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
              Add your first goal
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {goals.map((goal, index) => (
                <CompactGoalCard
                  key={goal.id}
                  goal={goal}
                  isSelected={goal.id === selectedGoalId}
                  onSelect={() => setSelectedGoalId(goal.id === selectedGoalId ? null : goal.id)}
                  progressColor={GOAL_COLORS[index % GOAL_COLORS.length]}
                />
              ))}
            </div>

            {selectedGoal && (
              <ExpandedGoalView
                goal={selectedGoal}
                onClose={() => setSelectedGoalId(null)}
                onStepToggle={(stepId, completed) => handleStepToggle(selectedGoal.id, stepId, completed)}
                onStepDelete={(stepId) => handleStepDelete(selectedGoal.id, stepId)}
                onStepUpdate={(stepId, text, timeEstimate) =>
                  handleStepUpdate(selectedGoal.id, stepId, text, timeEstimate)
                }
                onStepNotesUpdate={(stepId, notes) => handleStepNotesUpdate(selectedGoal.id, stepId, notes)}
                onGenerateNextStep={() => handleGenerateNextStep(selectedGoal.id)}
                onAddEmptyStep={() => handleAddEmptyStep(selectedGoal.id)}
                isGeneratingStep={isGeneratingStep}
              />
            )}
          </>
        )}
      </main>

      <AddGoalDialog open={dialogOpen} onOpenChange={setDialogOpen} onAddGoal={handleAddGoal} />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteGoal}
        title="Delete Goal"
        description="Are you sure you want to delete this goal? This action cannot be undone."
      />
    </div>
  )
}

