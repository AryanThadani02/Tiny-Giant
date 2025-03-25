"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TaskPriority } from "./task-manager"
import type { Goal } from "@/types/step"

// Define the Task interface here to avoid circular dependencies
interface Task {
  id: string
  title: string
  timeEstimate: number
  priority: TaskPriority
  completed: boolean
  completedAt?: number
  tags: string[]
  goalId: string | "adhoc"
}

interface AddTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTask: (task: Task) => void
  goals: Goal[]
}

export function AddTaskDialog({ open, onOpenChange, onAddTask, goals }: AddTaskDialogProps) {
  const [title, setTitle] = useState("")
  const [timeEstimate, setTimeEstimate] = useState("30")
  const [priority, setPriority] = useState<TaskPriority>("urgent-important")
  const [tags, setTags] = useState("")
  const [goalId, setGoalId] = useState<string | "adhoc">("adhoc")
  const [currentStep, setCurrentStep] = useState(1)

  const handleSubmit = () => {
    if (!title.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: title.trim(),
      timeEstimate: Number.parseInt(timeEstimate) || 30,
      priority,
      completed: false,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      goalId,
    }

    onAddTask(newTask)
    onOpenChange(false)

    // Reset form
    setTitle("")
    setTimeEstimate("30")
    setPriority("urgent-important")
    setTags("")
    setGoalId("adhoc")
    setCurrentStep(1)
  }

  const nextStep = () => {
    if (currentStep < 3 && title.trim()) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 1
              ? "What tiny task needs to be done?"
              : currentStep === 2
                ? "Set task details"
                : "Categorize your tiny task"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Step indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      step === currentStep ? "bg-blue-500" : step < currentStep ? "bg-gray-400" : "bg-gray-200"
                    }`}
                  />
                  {step < 3 && <div className={`w-8 h-0.5 ${step < currentStep ? "bg-gray-400" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
          </div>

          {currentStep === 1 && (
            <div className="space-y-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task description..."
                className="w-full"
              />
              <p className="text-sm text-gray-500">Be specific about what needs to be done.</p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <label htmlFor="timeEstimate" className="text-sm font-medium">
                  Time Estimate (minutes)
                </label>
                <Input
                  id="timeEstimate"
                  type="number"
                  min="1"
                  value={timeEstimate}
                  onChange={(e) => setTimeEstimate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="goalId" className="text-sm font-medium">
                  Related Goal
                </label>
                <Select value={goalId} onValueChange={(value) => setGoalId(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a goal or 'Ad hoc'" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adhoc">Ad hoc (No specific goal)</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Priority</label>
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="urgent-important"
                      name="priority"
                      value="urgent-important"
                      checked={priority === "urgent-important"}
                      onChange={() => setPriority("urgent-important")}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="urgent-important" className="text-sm">
                      Urgent and Important
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="urgent-not-important"
                      name="priority"
                      value="urgent-not-important"
                      checked={priority === "urgent-not-important"}
                      onChange={() => setPriority("urgent-not-important")}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="urgent-not-important" className="text-sm">
                      Urgent but Not Important
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="important-not-urgent"
                      name="priority"
                      value="important-not-urgent"
                      checked={priority === "important-not-urgent"}
                      onChange={() => setPriority("important-not-urgent")}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="important-not-urgent" className="text-sm">
                      Important but Not Urgent
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="neither"
                      name="priority"
                      value="neither"
                      checked={priority === "neither"}
                      onChange={() => setPriority("neither")}
                      className="h-4 w-4 text-blue-600"
                    />
                    <label htmlFor="neither" className="text-sm">
                      Neither Urgent nor Important
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="tags" className="text-sm font-medium">
                  Tags (comma separated)
                </label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Work, Personal, Project"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <Button type="button" variant="outline" onClick={prevStep}>
                Back
              </Button>
            )}
          </div>

          <div>
            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={currentStep === 1 && !title.trim()}
                className="bg-[#4F6BF4] hover:bg-[#4059CF]"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="bg-[#4F6BF4] hover:bg-[#4059CF]"
              >
                Add Tiny Task
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

