"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CalendarIcon, ChevronDown, ChevronUp, ArrowRight, ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { StepItem } from "./step-item"
import type { Step } from "@/types/step"

interface GoalCardProps {
  id: string
  title: string
  purpose: string
  dueDate?: string
  steps: Step[]
  onStepToggle: (goalId: string, stepId: string, completed: boolean) => void
  onStepAdd: (goalId: string, step: Step) => void
  onStepDelete: (goalId: string, stepId: string) => void
  onStepUpdate: (goalId: string, stepId: string, text: string, timeEstimate: number) => void
  onStepNotesUpdate: (goalId: string, stepId: string, notes: string) => void
  onDelete: (goalId: string) => void
}

export function GoalCard({
  id,
  title,
  purpose,
  dueDate,
  steps,
  onStepToggle,
  onStepAdd,
  onStepDelete,
  onStepUpdate,
  onStepNotesUpdate,
  onDelete,
}: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [isGeneratingNextStep, setIsGeneratingNextStep] = useState(false)
  const stepsContainerRef = useRef<HTMLDivElement>(null)

  // Format the date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return ""

    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString

      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
      return date.toLocaleDateString(undefined, options)
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateString
    }
  }

  // Calculate days left until due date
  const getDaysLeft = (dateString: string) => {
    if (!dateString) return ""

    try {
      const dueDate = new Date(dateString)
      if (isNaN(dueDate.getTime())) return ""

      dueDate.setHours(23, 59, 59, 999)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return "Overdue"
      if (diffDays === 0) return "Due today"
      if (diffDays === 1) return "1 day left"
      return `${diffDays} days left`
    } catch (error) {
      console.error("Error calculating days left:", error)
      return ""
    }
  }

  // Get days left text and determine color
  const getDaysLeftInfo = (dateString: string) => {
    const daysLeftText = getDaysLeft(dateString)
    let textColorClass = "text-gray-500"

    if (daysLeftText === "Overdue") {
      textColorClass = "text-red-500 font-medium"
    } else if (daysLeftText === "Due today") {
      textColorClass = "text-orange-500 font-medium"
    } else if (daysLeftText === "1 day left") {
      textColorClass = "text-orange-500"
    } else if (daysLeftText.includes("days left")) {
      const days = Number.parseInt(daysLeftText)
      if (days <= 3) textColorClass = "text-orange-400"
      if (days <= 7) textColorClass = "text-blue-500"
    }

    return { text: daysLeftText, colorClass: textColorClass }
  }

  // Calculate progress percentage
  const calculateProgress = () => {
    if (steps.length === 0) return 0
    const completedCount = steps.filter((s) => s.completed).length
    return Math.round((completedCount / steps.length) * 100)
  }

  // Handle generating and adding next step
  const handleGenerateNextStep = async () => {
    setIsGeneratingNextStep(true)

    try {
      const response = await fetch("/api/generate-next-step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: title,
          purpose: purpose,
          dueDate: dueDate,
          steps: steps,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate next step")

      const data = await response.json()

      if (data.nextStep) {
        const newStep: Step = {
          id: Date.now().toString(),
          text: data.nextStep,
          completed: false,
          timeEstimate: data.timeEstimate || 60, // Default to 60 minutes if not provided
          notes: "", // Initialize with empty notes string
        }
        onStepAdd(id, newStep)

        // Scroll to the end of the steps container after a short delay
        setTimeout(() => {
          if (stepsContainerRef.current) {
            stepsContainerRef.current.scrollLeft = stepsContainerRef.current.scrollWidth
          }
        }, 100)
      }
    } catch (error) {
      console.error("Error generating next step:", error)
    } finally {
      setIsGeneratingNextStep(false)
    }
  }

  // Scroll the steps container left or right
  const scrollSteps = (direction: "left" | "right") => {
    if (!stepsContainerRef.current) return

    const container = stepsContainerRef.current
    const scrollAmount = 300 // Slightly more than the width of a step card

    if (direction === "left") {
      container.scrollLeft -= scrollAmount
    } else {
      container.scrollLeft += scrollAmount
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 pr-2">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-8 w-8 text-gray-500 hover:text-red-500"
              onClick={() => onDelete(id)}
              title="Delete goal"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-0 h-8 w-8" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {purpose && <p className="mt-1 text-sm text-gray-600">{purpose}</p>}

        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-500">{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>
      </CardContent>

      {dueDate && (
        <CardFooter className="border-t px-6 py-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center text-sm text-gray-500">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Due by {formatDate(dueDate)}
            </div>
            <span className={`text-sm ${getDaysLeftInfo(dueDate).colorClass}`}>{getDaysLeftInfo(dueDate).text}</span>
          </div>
        </CardFooter>
      )}

      {expanded && (
        <div className="border-t px-6 py-3">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium">Steps:</h4>
              <Button
                type="button"
                size="sm"
                onClick={handleGenerateNextStep}
                disabled={isGeneratingNextStep}
                className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                {isGeneratingNextStep ? "Thinking..." : "Get Next Step"}
              </Button>
            </div>

            {steps.length > 0 ? (
              <div className="relative">
                {/* Navigation buttons */}
                {steps.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => scrollSteps("left")}
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 bg-white/80 shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => scrollSteps("right")}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 h-8 w-8 bg-white/80 shadow-sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {/* Horizontal scrolling container */}
                <div
                  ref={stepsContainerRef}
                  className="flex overflow-x-auto space-x-4 pb-3 px-1 scrollbar-hide"
                  style={{ scrollBehavior: "smooth" }}
                >
                  {steps.map((step, index) => (
                    <StepItem
                      key={step.id}
                      step={step}
                      stepNumber={index + 1}
                      onToggle={(completed) => onStepToggle(id, step.id, completed)}
                      onDelete={() => onStepDelete(id, step.id)}
                      onUpdate={(text, timeEstimate) => onStepUpdate(id, step.id, text, timeEstimate)}
                      onNotesUpdate={(notes) => onStepNotesUpdate(id, step.id, notes)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-3">No steps added yet. Click "Get Next Step" to start.</p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

