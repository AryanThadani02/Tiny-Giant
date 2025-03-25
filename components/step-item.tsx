"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, MessageSquare, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Step } from "@/types/step"

interface StepItemProps {
  step: Step
  stepNumber: number
  goalId: string
  goalTitle: string
  onToggle: (completed: boolean) => void
  onDelete: () => void
  onUpdate: (text: string, timeEstimate: number) => void
  onNotesUpdate: (notes: string) => void
  onConvertToTask?: (step: Step, goalId: string, goalTitle: string) => void
  expanded?: boolean // New prop to indicate if this is in the expanded view
}

export function StepItem({
  step,
  stepNumber,
  goalId,
  goalTitle,
  onToggle,
  onDelete,
  onUpdate,
  onNotesUpdate,
  onConvertToTask,
  expanded = false, // Default to false for backward compatibility
}: StepItemProps) {
  const [isEditingText, setIsEditingText] = useState(false)
  const [isEditingTime, setIsEditingTime] = useState(false)
  const [editText, setEditText] = useState(step.text)
  const [editTime, setEditTime] = useState(step.timeEstimate.toString())
  const [showNotes, setShowNotes] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const timeRef = useRef<HTMLInputElement>(null)

  // Focus the input when editing starts
  useEffect(() => {
    if (isEditingText && textRef.current) {
      textRef.current.focus()
    }
  }, [isEditingText])

  useEffect(() => {
    if (isEditingTime && timeRef.current) {
      timeRef.current.focus()
    }
  }, [isEditingTime])

  // Handle clicking outside to save
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isEditingText && textRef.current && !textRef.current.contains(event.target as Node)) {
        saveTextChanges()
      }
      if (isEditingTime && timeRef.current && !timeRef.current.contains(event.target as Node)) {
        saveTimeChanges()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isEditingText, isEditingTime, editText, editTime])

  const saveTextChanges = () => {
    if (editText.trim() !== step.text) {
      onUpdate(editText.trim(), step.timeEstimate)
    }
    setIsEditingText(false)
  }

  const saveTimeChanges = () => {
    const newTime = Number.parseInt(editTime)
    if (!isNaN(newTime) && newTime > 0 && newTime !== step.timeEstimate) {
      onUpdate(step.text, newTime)
    }
    setIsEditingTime(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent, type: "text" | "time") => {
    if (e.key === "Enter") {
      e.preventDefault()
      if (type === "text") {
        saveTextChanges()
      } else {
        saveTimeChanges()
      }
    } else if (e.key === "Escape") {
      if (type === "text") {
        setEditText(step.text)
        setIsEditingText(false)
      } else {
        setEditTime(step.timeEstimate.toString())
        setIsEditingTime(false)
      }
    }
  }

  const hasNotes = step.notes && step.notes.trim().length > 0

  // Determine width based on whether this is in the expanded view
  const widthClass = expanded ? "w-[350px]" : "w-[280px]"

  // Auto-show notes section for empty steps
  useEffect(() => {
    if (step.text === "") {
      setIsEditingText(true)
    }
  }, [step.text])

  const handleConvertToTask = () => {
    if (onConvertToTask) {
      onConvertToTask(step, goalId, goalTitle)
    }
  }

  return (
    <div className={`p-4 rounded-lg border flex-shrink-0 ${widthClass} ${step.completed ? "bg-gray-50" : "bg-white"}`}>
      <div className="flex items-start gap-2">
        <Checkbox checked={step.completed} onCheckedChange={onToggle} className="mt-1" />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="font-medium text-xs">Step {stepNumber}</div>
            <div className="flex space-x-1">
              {onConvertToTask && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleConvertToTask}
                  className="h-6 w-6 p-0 text-blue-500"
                  title="Convert to task"
                >
                  <ArrowRight className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotes(!showNotes)}
                className={`h-6 w-6 p-0 ${showNotes ? "bg-amber-100 text-amber-600" : hasNotes ? "text-amber-500" : "text-gray-500"}`}
                title={showNotes ? "Hide notes" : "Show notes"}
              >
                <MessageSquare className="h-3 w-3" />
                {hasNotes && !showNotes && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] rounded-full w-3.5 h-3.5 flex items-center justify-center">
                    •
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {isEditingText ? (
            <textarea
              ref={textRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "text")}
              onBlur={saveTextChanges}
              className="w-full text-sm border border-gray-300 rounded p-1 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              rows={3}
              placeholder="Enter step description..."
            />
          ) : (
            <p
              className={`text-sm line-clamp-3 cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 ${step.completed ? "text-gray-500 line-through" : "text-gray-900"}`}
              onClick={() => !step.completed && setIsEditingText(true)}
              title={step.completed ? "Complete this step to edit" : "Click to edit"}
            >
              {step.text || "Click to add step description"}
            </p>
          )}

          <div className="mt-1 text-xs text-gray-500">
            Time:{" "}
            {isEditingTime ? (
              <Input
                ref={timeRef}
                type="number"
                min="1"
                max="480"
                value={editTime}
                onChange={(e) => setEditTime(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, "time")}
                onBlur={saveTimeChanges}
                className="w-16 h-6 inline-block p-1 text-xs"
              />
            ) : (
              <span
                className="cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                onClick={() => !step.completed && setIsEditingTime(true)}
                title={step.completed ? "Complete this step to edit" : "Click to edit"}
              >
                {step.timeEstimate}
              </span>
            )}{" "}
            min
          </div>

          {/* Notes section - enhanced with formatting options */}
          {showNotes && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs font-medium">Notes:</div>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-blue-500"
                    onClick={() => onNotesUpdate(step.notes + "**bold text**")}
                    title="Bold"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-blue-500"
                    onClick={() => onNotesUpdate(step.notes + "*italic text*")}
                    title="Italic"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-blue-500"
                    onClick={() => onNotesUpdate(step.notes + "\n- List item")}
                    title="List"
                  >
                    •
                  </button>
                </div>
              </div>
              <Textarea
                value={step.notes || ""}
                onChange={(e) => onNotesUpdate(e.target.value)}
                placeholder="Add notes, ideas, or next actions for this step..."
                className="text-xs min-h-[120px] max-h-[200px] overflow-y-auto resize-none bg-amber-50 border-amber-100 focus-visible:ring-amber-200"
              />

              <div className="mt-1 text-[10px] text-gray-500">Supports markdown: **bold**, *italic*, - list items</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

