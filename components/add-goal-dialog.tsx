"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Wand2, Loader2 } from "lucide-react"
import type { Goal, Milestone } from "@/types/step"

interface AddGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddGoal: (goal: Goal) => void
}

export function AddGoalDialog({ open, onOpenChange, onAddGoal }: AddGoalDialogProps) {
  const [goal, setGoal] = useState("")
  const [purpose, setPurpose] = useState("")
  const [dueDate, setDueDate] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [isGeneratingMilestones, setIsGeneratingMilestones] = useState(false)

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split("T")[0]

  const handleClarifyGoal = async () => {
    if (!goal.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/clarify-goal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to clarify goal")
      }

      const data = await response.json()
      setGoal(data.clarifiedGoal)
    } catch (error) {
      console.error("Error clarifying goal:", error)
      setError(error instanceof Error ? error.message : "Failed to clarify goal")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateMilestones = async () => {
    if (!goal.trim()) return

    setIsGeneratingMilestones(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ goal, purpose }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate milestones")
      }

      const data = await response.json()

      // Create milestone objects from the strings
      const newMilestones = data.milestones.map((title: string) => ({
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        title,
        completed: false,
        steps: [],
        bonusPoints: 50, // Default bonus points
      }))

      setMilestones(newMilestones)
    } catch (error) {
      console.error("Error generating milestones:", error)
      setError(error instanceof Error ? error.message : "Failed to generate milestones")
    } finally {
      setIsGeneratingMilestones(false)
    }
  }

  const handleSubmit = () => {
    if (!goal.trim()) return

    const newGoal: Goal = {
      id: Date.now().toString(),
      title: goal,
      purpose: purpose,
      dueDate: dueDate || undefined,
      milestones: milestones,
      currentPoints: 0,
      totalPoints: 50, // Default 50 points to complete
    }

    onAddGoal(newGoal)
    onOpenChange(false)

    // Reset form
    setGoal("")
    setPurpose("")
    setDueDate("")
    setMilestones([])
    setError(null)
    setCurrentStep(1)
  }

  const nextStep = () => {
    if (currentStep < 3 && goal.trim()) {
      setCurrentStep(currentStep + 1)

      // Auto-generate milestones when reaching the milestone step if none exist yet
      if (currentStep === 1 && milestones.length === 0) {
        handleGenerateMilestones()
      }
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
              ? "What's your big goal?"
              : currentStep === 2
                ? "Why is this important?"
                : "When will you achieve it?"}
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
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <Input
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Enter your goal..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleClarifyGoal}
                    disabled={isLoading || !goal.trim()}
                    title="Clarify with AI"
                  >
                    <Wand2 className="h-4 w-4" />
                  </Button>
                </div>
                {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                {isLoading && <p className="text-sm text-gray-500 mt-1">Clarifying your goal...</p>}
              </div>
              <p className="text-sm text-gray-500">
                Make your goal specific and measurable. The AI can help clarify it.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <Textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Why is this goal important to you?"
                rows={4}
              />
              <p className="text-sm text-gray-500">Understanding your motivation will help you stay committed.</p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} min={today} />
              <p className="text-sm text-gray-500">
                Setting a deadline creates accountability and helps track progress.
              </p>

              {/* Milestone preview */}
              {milestones.length > 0 ? (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Suggested Milestones:</h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateMilestones}
                      disabled={isGeneratingMilestones}
                      className="h-7 text-xs"
                    >
                      {isGeneratingMilestones ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Regenerate
                        </>
                      ) : (
                        "Regenerate"
                      )}
                    </Button>
                  </div>

                  <div className="border rounded-md p-3 space-y-1 max-h-[200px] overflow-y-auto">
                    {milestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 w-5">{index + 1}.</span>
                          <span className="text-sm">{milestone.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 mt-2">You can edit these milestones after creating your goal.</p>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
                  {isGeneratingMilestones ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                      <p className="text-sm text-blue-700">Generating milestones for your goal...</p>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-700">
                      Please wait for milestones to be generated before creating your goal.
                    </p>
                  )}
                </div>
              )}
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
                disabled={currentStep === 1 && !goal.trim()}
                className="bg-[#4F6BF4] hover:bg-[#4059CF]"
              >
                Continue
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!goal.trim() || isGeneratingMilestones || milestones.length === 0}
                className="bg-[#4F6BF4] hover:bg-[#4059CF]"
              >
                Create Big Goal
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

