"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { MilestoneJourney } from "@/components/milestone-journey"
import type { Goal, Step } from "@/types/step"
import type { Task } from "@/components/task-manager"

interface ExpandedGoalViewProps {
  goal: Goal
  onClose: () => void
  onMilestoneToggle: (milestoneId: string, completed: boolean) => void
  onGenerateMilestones: (goalId: string) => void
  onUpdateGoalPoints: (goalId: string, points: number) => void
  onStepToggle: (milestoneId: string, stepId: string, completed: boolean) => void
  onAddStep: (milestoneId: string) => void
  onAddGeneratedSteps: (milestoneId: string, steps: Step[]) => void
  onUpdateStep: (milestoneId: string, stepId: string, text: string, timeEstimate: number) => void
  onDeleteStep?: (goalId: string, milestoneId: string, stepId: string) => void
  onAddTask: (task: Task) => void
  isGeneratingMilestones: boolean
  tasks: Task[]
}

export function ExpandedGoalView({
  goal,
  onClose,
  onMilestoneToggle,
  onGenerateMilestones,
  onUpdateGoalPoints,
  onStepToggle,
  onAddStep,
  onAddGeneratedSteps,
  onUpdateStep,
  onDeleteStep,
  onAddTask,
  isGeneratingMilestones,
  tasks,
}: ExpandedGoalViewProps) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(goal.title)
  const [purpose, setPurpose] = useState(goal.purpose)
  const [points, setPoints] = useState(goal.totalPoints.toString())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleSave = () => {
    // TODO: Save changes to goal
    setEditing(false)
  }

  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    // TODO: Delete goal
    setDeleteDialogOpen(false)
    onClose()
  }

  const handleStepToggle = (milestoneId: string, stepId: string, completed: boolean) => {
    console.log("ExpandedGoalView toggling step:", { milestoneId, stepId, completed })
    if (onStepToggle) {
      onStepToggle(milestoneId, stepId, completed)
    }
  }

  const handleAddStep = (milestoneId: string) => {
    console.log("ExpandedGoalView adding step to milestone:", milestoneId)
    if (onAddStep) {
      onAddStep(goal.id, milestoneId)
    }
  }

  const handleAddGeneratedSteps = (milestoneId: string, steps: Step[]) => {
    console.log("Expanded view adding steps:", { milestoneId, steps })
    if (onAddGeneratedSteps) {
      onAddGeneratedSteps(goal.id, milestoneId, steps)
    }
  }

  const handleUpdateStep = (milestoneId: string, stepId: string, text: string, timeEstimate: number) => {
    if (onUpdateStep) {
      onUpdateStep(milestoneId, stepId, text, timeEstimate)
    }
  }

  const handleDeleteStep = (milestoneId: string, stepId: string) => {
    if (onDeleteStep) {
      onDeleteStep(goal.id, milestoneId, stepId)
    }
  }

  const handleConvertStepToTask = (milestoneId: string, step: Step, goalId: string, goalTitle: string) => {
    if (onAddTask) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: step.text,
        timeEstimate: step.timeEstimate,
        priority: "important-not-urgent",
        completed: false,
        tags: [],
        goalId: goalId,
        sourceStepId: step.id,
        sourceMilestoneId: milestoneId, // Make sure this is set correctly
      }
      onAddTask(newTask)
    }
  }

  return (
    <Dialog open={!!goal} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editing ? <Input value={title} onChange={(e) => setTitle(e.target.value)} /> : <>{goal.title}</>}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {editing ? (
            <>
              <Textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose" />
              <Input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="Total Points"
              />
            </>
          ) : (
            <>
              {goal.purpose && <p className="text-gray-600">{goal.purpose}</p>}
              <p className="text-gray-500">Total Points: {goal.totalPoints}</p>
            </>
          )}

          <MilestoneJourney
            milestones={goal.milestones}
            onToggle={(milestoneId, completed) => onMilestoneToggle(goal.id, milestoneId, completed)}
            onStepToggle={(milestoneId, stepId, completed) => handleStepToggle(milestoneId, stepId, completed)}
            onAddStep={handleAddStep}
            onAddGeneratedSteps={handleAddGeneratedSteps}
            onUpdateStep={handleUpdateStep}
            onDeleteStep={handleDeleteStep}
            onConvertStepToTask={handleConvertStepToTask}
            goalId={goal.id}
            goalTitle={goal.title}
            goalPurpose={goal.purpose}
            goalDueDate={goal.dueDate}
            tasks={tasks}
            currentPoints={goal.currentPoints}
            totalPoints={goal.totalPoints}
          />
        </div>

        <DialogFooter>
          {editing ? (
            <>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => setEditing(true)}>Edit</Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Goal"
        description="Are you sure you want to delete this goal? This action cannot be undone."
      />
    </Dialog>
  )
}

