"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { CheckCircle2, ChevronDown, ChevronUp, Plus, Wand2, Loader2, Clock, Trash2 } from "lucide-react"
import type { Milestone, Step } from "@/types/step"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Task } from "@/components/task-manager"

interface MilestoneJourneyProps {
  milestones: Milestone[]
  onToggle: (milestoneId: string, completed: boolean) => void
  onStepToggle?: (milestoneId: string, stepId: string, completed: boolean) => void
  onAddStep?: (milestoneId: string) => void
  onAddGeneratedSteps?: (milestoneId: string, steps: Step[]) => void
  onUpdateStep?: (milestoneId: string, stepId: string, text: string, timeEstimate: number) => void
  onConvertStepToTask?: (milestoneId: string, step: Step, goalId: string, goalTitle: string) => void
  onDeleteStep?: (milestoneId: string, stepId: string) => void
  goalId: string
  goalTitle?: string
  goalPurpose?: string
  goalDueDate?: string
  tasks?: Task[]
  currentPoints?: number
  totalPoints?: number
}

export function MilestoneJourney({
  milestones,
  onToggle,
  onStepToggle,
  onAddStep,
  onAddGeneratedSteps,
  onUpdateStep,
  onConvertStepToTask,
  onDeleteStep,
  goalId,
  goalTitle = "",
  goalPurpose = "",
  goalDueDate = "",
  tasks = [],
  currentPoints = 0,
  totalPoints = 50,
}: MilestoneJourneyProps) {
  // Track which milestones are expanded
  const [expandedMilestoneId, setExpandedMilestoneId] = useState<string | null>(null)
  // Track which milestones are generating steps
  const [generatingSteps, setGeneratingSteps] = useState<Record<string, boolean>>({})
  // Track which step is being edited
  const [editingStep, setEditingStep] = useState<{ milestoneId: string; stepId: string } | null>(null)
  // Track edited step text and time
  const [editStepText, setEditStepText] = useState("")
  const [editStepTime, setEditStepTime] = useState("")

  // Refs for editing
  const textInputRef = useRef<HTMLTextAreaElement>(null)
  const timeInputRef = useRef<HTMLInputElement>(null)

  // Check if we're on mobile
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Sort milestones by ID (as a proxy for creation order)
  const sortedMilestones = [...milestones].sort((a, b) => {
    return Number(a.id) - Number(b.id)
  })

  // Calculate completion percentage based on points instead of milestones
  const completionPercentage = totalPoints > 0 ? Math.round((currentPoints / totalPoints) * 100) : 0

  // Toggle milestone expansion
  const toggleExpand = (milestoneId: string) => {
    setExpandedMilestoneId(expandedMilestoneId === milestoneId ? null : milestoneId)
  }

  // Handle step toggle - simplified to avoid unnecessary state updates
  const handleStepToggle = (milestoneId: string, stepId: string, completed: boolean) => {
    if (onStepToggle) {
      onStepToggle(milestoneId, stepId, completed)
    }
  }

  // Handle adding a new step
  const handleAddStep = (milestoneId: string) => {
    console.log("Adding step manually to milestone:", milestoneId)
    if (onAddStep) {
      onAddStep(milestoneId)

      // Expand the milestone to show the new step
      setExpandedMilestoneId(milestoneId)
    }
  }

  // Handle deleting a step
  const handleDeleteStep = (milestoneId: string, stepId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDeleteStep) {
      onDeleteStep(milestoneId, stepId)
    } else {
      // Fallback if onDeleteStep is not provided
      const milestone = milestones.find((m) => m.id === milestoneId)
      if (milestone && milestone.steps) {
        const updatedSteps = milestone.steps.filter((s) => s.id !== stepId)
        if (onUpdateStep) {
          // This is a hack to update the milestone's steps array
          // by updating a dummy step with a special flag
          onUpdateStep(milestoneId, "__DELETE_STEP__", stepId, 0)
        }
      }
    }
  }

  // Start editing a step
  const startEditingStep = (milestoneId: string, step: Step) => {
    if (step.completed) return // Don't allow editing completed steps

    setEditingStep({ milestoneId, stepId: step.id })
    setEditStepText(step.text)
    setEditStepTime(step.timeEstimate.toString())
  }

  // Save edited step
  const saveEditedStep = () => {
    if (editingStep && onUpdateStep) {
      onUpdateStep(
        editingStep.milestoneId,
        editingStep.stepId,
        editStepText.trim(),
        Number.parseInt(editStepTime) || 30,
      )
      setEditingStep(null)
    }
  }

  // Cancel editing
  const cancelEditing = () => {
    setEditingStep(null)
  }

  // Handle converting step to task
  const handleConvertToTask = (milestoneId: string, step: Step, e: React.MouseEvent) => {
    e.stopPropagation()
    if (onConvertStepToTask) {
      onConvertStepToTask(milestoneId, step, goalId, goalTitle)
    }
  }

  // Focus input when editing starts
  useEffect(() => {
    if (editingStep && textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [editingStep])

  // Handle click outside to save
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingStep) {
        const isTextInputClicked = textInputRef.current && textInputRef.current.contains(event.target as Node)
        const isTimeInputClicked = timeInputRef.current && timeInputRef.current.contains(event.target as Node)

        if (!isTextInputClicked && !isTimeInputClicked) {
          saveEditedStep()
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [editingStep, editStepText, editStepTime])

  // Handle generating steps for a milestone
  const handleGenerateSteps = async (milestone: Milestone) => {
    if (!onAddGeneratedSteps) {
      console.error("onAddGeneratedSteps callback is not defined")
      return
    }

    // Set loading state
    setGeneratingSteps((prev) => ({
      ...prev,
      [milestone.id]: true,
    }))

    try {
      console.log("Generating steps for milestone:", milestone.title)

      const response = await fetch("/api/generate-milestone-steps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalTitle,
          milestoneTitle: milestone.title,
          purpose: goalPurpose,
          dueDate: goalDueDate,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate steps: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API response:", data)

      if (data.steps && data.steps.length > 0) {
        // Create step objects from the API response
        const newSteps = data.steps.map((stepData: any) => ({
          id: Date.now() + "-" + Math.random().toString(36).substring(2, 9),
          text: stepData.text,
          completed: false,
          timeEstimate: Number.parseInt(stepData.timeEstimate) || 30,
          notes: "",
        }))

        console.log("Created new steps:", newSteps)

        // Add the steps to the milestone
        onAddGeneratedSteps(milestone.id, newSteps)

        // Expand the milestone to show the new steps
        setExpandedMilestoneId(milestone.id)
      } else {
        console.warn("No steps returned from API, using default steps")
        // If no steps were returned, create some default steps
        const defaultSteps = [
          {
            id: Date.now() + "-" + Math.random().toString(36).substring(2, 9),
            text: "Research and gather information",
            completed: false,
            timeEstimate: 45,
            notes: "",
          },
          {
            id: Date.now() + "-" + Math.random().toString(36).substring(2, 9) + "1",
            text: "Create a detailed action plan",
            completed: false,
            timeEstimate: 30,
            notes: "",
          },
          {
            id: Date.now() + "-" + Math.random().toString(36).substring(2, 9) + "2",
            text: "Execute first key task",
            completed: false,
            timeEstimate: 60,
            notes: "",
          },
        ]

        console.log("Using default steps:", defaultSteps)
        onAddGeneratedSteps(milestone.id, defaultSteps)
        setExpandedMilestoneId(milestone.id)
      }
    } catch (error) {
      console.error("Error generating steps:", error)

      // If there's an error, still provide some default steps
      const fallbackSteps = [
        {
          id: Date.now() + "-" + Math.random().toString(36).substring(2, 9),
          text: "Research and gather information about this milestone",
          completed: false,
          timeEstimate: 45,
          notes: "",
        },
        {
          id: Date.now() + "-" + Math.random().toString(36).substring(2, 9) + "1",
          text: "Create a detailed action plan",
          completed: false,
          timeEstimate: 30,
          notes: "",
        },
        {
          id: Date.now() + "-" + Math.random().toString(36).substring(2, 9) + "2",
          text: "Execute first key task",
          completed: false,
          timeEstimate: 60,
          notes: "",
        },
      ]

      console.log("Using fallback steps due to error:", fallbackSteps)
      onAddGeneratedSteps(milestone.id, fallbackSteps)
      setExpandedMilestoneId(milestone.id)
    } finally {
      // Clear loading state
      setGeneratingSteps((prev) => ({
        ...prev,
        [milestone.id]: false,
      }))
    }
  }

  // Update the progress bar to be more responsive
  return (
    <div className="mt-4 mb-8">
      {/* Progress indicator */}
      <div className="mb-6 px-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-gray-500">{completionPercentage}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        <div className="mt-1 text-xs text-gray-500 flex items-center justify-between">
          <span>
            {currentPoints} / {totalPoints} points
          </span>
          <span>
            {milestones.filter((m) => m.completed).length} / {milestones.length} milestones
          </span>
        </div>
      </div>

      {/* Milestone list */}
      <div className="space-y-4">
        {sortedMilestones.map((milestone, index) => (
          <div
            key={milestone.id}
            className={`border rounded-lg overflow-hidden transition-all duration-200 ${
              expandedMilestoneId === milestone.id ? "shadow-md" : "hover:shadow-sm"
            } ${milestone.completed ? "bg-green-50 border-green-200" : "bg-white"}`}
          >
            {/* Milestone header */}
            <div className="flex items-center p-4 cursor-pointer" onClick={() => toggleExpand(milestone.id)}>
              {/* Milestone number */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  milestone.completed ? "bg-green-500 text-white" : "bg-blue-500 text-white"
                }`}
              >
                {milestone.completed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <span className="font-bold">{index + 1}</span>
                )}
              </div>

              {/* Milestone title */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium ${milestone.completed ? "text-green-700" : "text-gray-800"}`}>
                  {milestone.title}
                </h3>
                <div className="text-xs text-gray-500 mt-0.5">
                  {milestone.steps?.length || 0} steps • {milestone.completed ? "Completed" : "In progress"}
                </div>
              </div>

              {/* Toggle button */}
              <div className="flex items-center ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggle(milestone.id, !milestone.completed)
                  }}
                  title={milestone.completed ? "Mark as incomplete" : "Mark as complete"}
                >
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      milestone.completed ? "border-green-500 text-green-500" : "border-gray-400 text-gray-400"
                    }`}
                  >
                    {milestone.completed ? <CheckCircle2 className="h-3 w-3" /> : null}
                  </div>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1">
                  {expandedMilestoneId === milestone.id ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Steps section */}
            {expandedMilestoneId === milestone.id && (
              <div className="border-t px-4 py-3 bg-gray-50">
                {/* Steps header */}
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700">Tiny Steps</h4>
                  <div className="flex gap-2">
                    {onAddGeneratedSteps && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateSteps(milestone)}
                        disabled={generatingSteps[milestone.id]}
                        className="h-7 text-xs"
                      >
                        {generatingSteps[milestone.id] ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3 w-3 mr-1" />
                            Generate Steps with AI
                          </>
                        )}
                      </Button>
                    )}
                    {onAddStep && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddStep(milestone.id)}
                        className="h-7 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Step Manually
                      </Button>
                    )}
                  </div>
                </div>

                {/* Steps list */}
                {!milestone.steps || milestone.steps.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No steps added yet. Generate or add steps to get started.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {milestone.steps.map((step: Step, stepIndex: number) => {
                      const isLinkedToTask = tasks?.some(
                        (task) => task.sourceStepId === step.id && task.sourceMilestoneId === milestone.id,
                      )
                      return (
                        <div
                          key={step.id}
                          className={`rounded-md border ${step.completed ? "bg-gray-50" : "bg-white hover:bg-blue-50"} transition-colors overflow-hidden ${
                            editingStep?.stepId === step.id ? "ring-2 ring-blue-500" : ""
                          }`}
                        >
                          {/* Editing mode */}
                          {editingStep && editingStep.stepId === step.id ? (
                            <div className="p-3">
                              <Textarea
                                ref={textInputRef}
                                value={editStepText}
                                onChange={(e) => setEditStepText(e.target.value)}
                                className="text-sm mb-2 min-h-[60px]"
                                placeholder="Step description..."
                              />
                              <div className="flex items-center gap-2 mb-2">
                                <label className="text-xs text-gray-500">Time (min):</label>
                                <Input
                                  ref={timeInputRef}
                                  type="number"
                                  value={editStepTime}
                                  onChange={(e) => setEditStepTime(e.target.value)}
                                  className="h-7 text-xs w-16"
                                  min="1"
                                  max="240"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-7 px-2 text-xs">
                                  Cancel
                                </Button>
                                <Button size="sm" onClick={saveEditedStep} className="h-7 px-2 text-xs">
                                  Save
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="p-3 cursor-pointer group"
                              onClick={() => !step.completed && startEditingStep(milestone.id, step)}
                            >
                              <div className="flex items-start gap-2">
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    id={`step-${step.id}`}
                                    checked={step.completed}
                                    onCheckedChange={(checked) => {
                                      handleStepToggle(milestone.id, step.id, checked === true)
                                    }}
                                    className="mt-0.5"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-start">
                                    <label
                                      htmlFor={`step-${step.id}`}
                                      className={`text-sm ${step.completed ? "line-through text-gray-500" : "text-gray-700"}`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {step.text}
                                      {isLinkedToTask && (
                                        <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full">
                                          Task
                                        </span>
                                      )}
                                    </label>

                                    {/* Action buttons */}
                                    <div className="flex items-center space-x-1">
                                      {/* Delete button - always visible */}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => handleDeleteStep(milestone.id, step.id, e)}
                                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        title="Delete step"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between mt-1">
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Clock className="h-3 w-3 mr-1 inline" />
                                      {step.timeEstimate} min
                                    </div>
                                    {onConvertStepToTask && !isLinkedToTask && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => handleConvertToTask(milestone.id, step, e)}
                                        className="h-5 px-2 py-0 text-[10px] text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                                        title="Convert to task"
                                      >
                                        Add to Tasks
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

