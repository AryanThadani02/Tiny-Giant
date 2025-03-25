"use client"

import { ChevronDown, ChevronUp, Zap, Star, ArrowRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Goal } from "@/types/step"
import { useEffect, useState } from "react"
import type { Step, Milestone } from "@/types/step"

interface Task {
  id: string
  goalId: string
  title: string
  completed: boolean
  completedAt?: number
}

interface CompactGoalCardProps {
  goal: Goal
  isSelected: boolean
  onSelect: () => void
  progressColor: string
  tasks?: Task[]
  onConvertStepToTask?: (milestoneId: string, step: Step, goalId: string, goalTitle: string) => void
}

export function CompactGoalCard({
  goal,
  isSelected,
  onSelect,
  progressColor,
  tasks = [],
  onConvertStepToTask,
}: CompactGoalCardProps) {
  // State to track progress animation
  const [displayProgress, setDisplayProgress] = useState(0)
  const [actualProgress, setActualProgress] = useState(0)

  // Calculate days left
  const getDaysLeft = () => {
    if (!goal.dueDate) return null

    try {
      const dueDate = new Date(goal.dueDate)
      if (isNaN(dueDate.getTime())) return null

      dueDate.setHours(23, 59, 59, 999)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return diffDays
    } catch (error) {
      return null
    }
  }

  // Calculate progress percentage based on points
  const calculateProgress = () => {
    const totalPoints = goal.totalPoints || 50
    const currentPoints = goal.currentPoints || 0
    return Math.min(Math.round((currentPoints / totalPoints) * 100), 100)
  }

  // Update actual progress when points change
  useEffect(() => {
    setActualProgress(calculateProgress())
  }, [goal.currentPoints, goal.totalPoints])

  // Animate progress bar
  useEffect(() => {
    // If no change, don't animate
    if (displayProgress === actualProgress) return

    // Animate progress over time
    const animationDuration = 500 // ms
    const startTime = Date.now()
    const startProgress = displayProgress

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)

      // Calculate current animation value using easing
      const easedProgress = 1 - Math.pow(1 - progress, 3) // Cubic ease-out
      const currentValue = startProgress + (actualProgress - startProgress) * easedProgress

      setDisplayProgress(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayProgress(actualProgress)
      }
    }

    requestAnimationFrame(animate)
  }, [actualProgress, displayProgress])

  // Calculate momentum based on recent completions and goal age
  const calculateMomentum = () => {
    // Get goal creation time from ID (assuming ID is a timestamp string)
    const goalCreationTime = Number.parseInt(goal.id, 10) || Date.now()
    const goalAgeInHours = (Date.now() - goalCreationTime) / (1000 * 60 * 60)

    // If goal is less than 24 hours old, don't show "low momentum"
    const isNewGoal = goalAgeInHours < 24

    // Count completed tasks for this goal
    const completedTasks = tasks.filter((t) => t.goalId === goal.id && t.completed).length
    const totalTasks = tasks.filter((t) => t.goalId === goal.id).length

    // If there are no tasks yet and the goal is new, return "neutral"
    if (totalTasks === 0) {
      return isNewGoal ? "neutral" : "low"
    }

    // If no tasks are completed
    if (completedTasks === 0) {
      return isNewGoal ? "neutral" : "low"
    }

    // Calculate the percentage of completed tasks
    const completionRate = completedTasks / totalTasks

    // Calculate recency factor - how many tasks were completed recently
    const now = Date.now()
    const oneDayAgo = now - 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    const threeDaysAgo = now - 3 * 24 * 60 * 60 * 1000 // 3 days in milliseconds

    // Count recent task completions
    const recentCompletions = tasks.filter(
      (t) => t.goalId === goal.id && t.completed && t.completedAt && t.completedAt > threeDaysAgo,
    ).length

    const veryRecentCompletions = tasks.filter(
      (t) => t.goalId === goal.id && t.completed && t.completedAt && t.completedAt > oneDayAgo,
    ).length

    // If there are very recent completions (last 24 hours), momentum is high
    if (veryRecentCompletions > 0) {
      return "high"
    }

    // If there are recent completions (last 3 days), momentum is medium
    if (recentCompletions > 0) {
      return "medium"
    }

    // If no recent completions but high overall completion rate
    if (completionRate >= 0.7) {
      return "medium" // Mostly done but no recent activity
    }

    // Otherwise, low momentum (no activity in last 3 days)
    return "low"
  }

  const getMomentumColor = (momentum: string) => {
    switch (momentum) {
      case "high":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-red-500"
      case "neutral":
      default:
        return "bg-gray-300"
    }
  }

  const getMomentumLabel = (momentum: string) => {
    switch (momentum) {
      case "high":
        return "Strong momentum"
      case "medium":
        return "Steady momentum"
      case "low":
        return "Low momentum"
      case "neutral":
      default:
        return "Just started"
    }
  }

  const getMomentumIcon = (momentum: string) => {
    switch (momentum) {
      case "high":
        return <Zap className="h-3.5 w-3.5 text-green-500" />
      case "medium":
        return <Zap className="h-3.5 w-3.5 text-yellow-500" />
      case "low":
        return <Zap className="h-3.5 w-3.5 text-red-500 opacity-50" />
      case "neutral":
      default:
        return <Zap className="h-3.5 w-3.5 text-gray-400" />
    }
  }

  const daysLeft = getDaysLeft()
  const momentum = calculateMomentum()
  const momentumColor = getMomentumColor(momentum)
  const momentumLabel = getMomentumLabel(momentum)
  const momentumIcon = getMomentumIcon(momentum)
  const totalPoints = goal.totalPoints || 50
  const currentPoints = goal.currentPoints || 0
  const completedMilestones = goal.milestones.filter((m) => m.completed).length
  const totalMilestones = goal.milestones.length

  // Add this function before the return statement

  const findNextOpenStep = () => {
    // If there are no milestones or they don't have steps, return null
    if (!goal.milestones || goal.milestones.length === 0) {
      return null
    }

    // Go through milestones in order
    for (const milestone of goal.milestones) {
      // Skip completed milestones
      if (milestone.completed) continue

      // If the milestone has no steps, continue to the next milestone
      if (!milestone.steps || milestone.steps.length === 0) continue

      // Find the first incomplete step in this milestone
      const nextStep = milestone.steps.find((step) => !step.completed)

      if (nextStep) {
        return {
          step: nextStep,
          milestone,
        }
      }
    }

    // If we've gone through all milestones and found no incomplete steps
    return null
  }

  const nextOpenStep = findNextOpenStep()

  // Add a function to handle sending a step to tasks
  const handleSendToTasks = (step: Step, milestone: Milestone) => {
    if (onConvertStepToTask) {
      onConvertStepToTask(milestone.id, step, goal.id, goal.title)
    }
  }

  // Update the CompactGoalCard styling for a more polished look
  return (
    <div
      className={`p-4 rounded-lg border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
        isSelected ? "border-blue-500 bg-blue-50" : "hover:border-gray-300"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: progressColor }} />
          <h3 className="font-medium text-gray-800">{goal.title}</h3>
        </div>
        <Button variant="ghost" size="sm" className="p-0 h-6 w-6 -mt-1 -mr-1 text-gray-500 hover:text-gray-700">
          {isSelected ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Purpose/motivation */}
      {goal.purpose && <p className="text-xs text-gray-600 mb-2 line-clamp-2">{goal.purpose}</p>}

      {daysLeft !== null && (
        <div className="text-sm text-gray-500 mb-2 flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
          {daysLeft} days left
        </div>
      )}

      {/* Combined Progress & Momentum meter */}
      <div className="mt-3">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium">Progress</span>
            {momentumIcon}
          </div>
          <span className="text-xs text-gray-500 font-medium">{actualProgress}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${displayProgress}%`,
              backgroundColor:
                momentum === "high"
                  ? "#10B981"
                  : momentum === "medium"
                    ? "#F59E0B"
                    : momentum === "low"
                      ? "#EF4444"
                      : progressColor,
            }}
          ></div>
        </div>
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <div className="flex items-center bg-amber-50 px-2 py-1 rounded-full">
            <Star className="h-3 w-3 mr-1 text-amber-400" />
            <span className="font-medium">
              {currentPoints} / {totalPoints} points
            </span>
          </div>
          {completedMilestones > 0 && (
            <span className="bg-blue-50 px-2 py-1 rounded-full text-blue-600 font-medium">
              {completedMilestones} milestone{completedMilestones !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
      {/* Next Step Section */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="text-xs font-medium text-gray-700 mb-2">Next Step:</div>

        {nextOpenStep ? (
          <div className="bg-gray-50 rounded-md p-2 border border-gray-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 line-clamp-2">{nextOpenStep.step.text}</p>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  {nextOpenStep.step.timeEstimate} min
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSendToTasks(nextOpenStep.step, nextOpenStep.milestone)
                }}
                className="h-6 px-2 py-0 text-[10px] text-blue-500 hover:text-blue-600 hover:bg-blue-50 ml-1"
                title="Add to tasks"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Send to Tasks
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-md p-2 border border-dashed border-gray-200 text-center">
            {goal.milestones.some((m) => m.steps && m.steps.length > 0) ? (
              <p className="text-xs text-gray-500">All steps are completed! 🎉</p>
            ) : (
              <p className="text-xs text-gray-500">No steps generated yet. Open goal to generate steps.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

