"use client"

import { useState, useEffect } from "react"
import { Clock, ArrowUp, ArrowDown, Check, Tag, Link, Star } from "lucide-react"
import type { Goal } from "@/types/step"

export type TaskPriority = "urgent-important" | "urgent-not-important" | "important-not-urgent" | "neither"

// Update the Task interface to include sourceStepId and sourceMilestoneId
export interface Task {
  id: string
  title: string
  timeEstimate: number // in minutes
  priority: TaskPriority
  completed: boolean
  completedAt?: number // Add timestamp for when the task was completed
  tags: string[]
  goalId: string | "adhoc" // Either a goal ID or "adhoc"
  sourceStepId?: string // Add reference to the original step
  sourceMilestoneId?: string // Add reference to the original milestone
}

interface TaskManagerProps {
  goals: Goal[]
  tasks?: Task[] // Make tasks optional
  onAddTask?: (task: Task) => void // Add callback for adding tasks
  onToggleComplete?: (taskId: string) => void // Add callback for toggling completion
  onMoveTask?: (taskId: string, direction: "up" | "down") => void // Add callback for moving tasks
}

export function TaskManager({ goals, tasks: propTasks, onAddTask, onToggleComplete, onMoveTask }: TaskManagerProps) {
  const [tasks, setTasks] = useState<Task[]>([])

  // Use prop tasks if provided, otherwise load from localStorage
  useEffect(() => {
    if (propTasks) {
      setTasks(propTasks)
    } else {
      const savedTasks = localStorage.getItem("tiny-giant-tasks")
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks)
          setTasks(parsedTasks)
        } catch (error) {
          console.error("Error loading tasks:", error)
          localStorage.removeItem("tiny-giant-tasks")
        }
      }
    }
  }, [propTasks])

  // Only save to localStorage if we're not using prop tasks
  useEffect(() => {
    if (!propTasks) {
      try {
        localStorage.setItem("tiny-giant-tasks", JSON.stringify(tasks))
      } catch (error) {
        console.error("Error saving tasks:", error)
      }
    }
  }, [tasks, propTasks])

  const handleToggleComplete = (taskId: string) => {
    if (onToggleComplete) {
      onToggleComplete(taskId)
    } else {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                completed: !task.completed,
                completedAt: !task.completed ? Date.now() : undefined,
              }
            : task,
        ),
      )
    }
  }

  // Update the handleMoveTask function to match the expected signature
  const handleMoveTask = (taskId: string, direction: "up" | "down") => {
    if (onMoveTask) {
      onMoveTask(taskId, direction)
    } else {
      const taskIndex = tasks.findIndex((task) => task.id === taskId)
      if (taskIndex === -1) return

      const task = tasks[taskIndex]
      const priorities: TaskPriority[] = ["urgent-important", "urgent-not-important", "important-not-urgent", "neither"]
      const currentPriorityIndex = priorities.indexOf(task.priority)

      let newPriorityIndex = currentPriorityIndex
      if (direction === "up" && currentPriorityIndex > 0) {
        newPriorityIndex = currentPriorityIndex - 1
      } else if (direction === "down" && currentPriorityIndex < priorities.length - 1) {
        newPriorityIndex = currentPriorityIndex + 1
      }

      if (newPriorityIndex !== currentPriorityIndex) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, priority: priorities[newPriorityIndex] } : t)))
      }
    }
  }

  const getPriorityTasks = (priority: TaskPriority) => {
    return tasks.filter((task) => task.priority === priority)
  }

  const getGoalTitle = (goalId: string | "adhoc") => {
    if (goalId === "adhoc") return "Ad hoc"
    const goal = goals.find((g) => g.id === goalId)
    return goal ? goal.title : "Unknown Goal"
  }

  // Get the points contribution for a task
  const getPointsContribution = (task: Task) => {
    if (task.goalId === "adhoc" || !task.completed) return null

    // Each completed task contributes 1 point to its goal
    return 1
  }

  // Update the TaskManager component styling
  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md border">
        <div className="flex items-center mb-2">
          <Star className="h-5 w-5 mr-2 text-amber-500" />
          <h3 className="text-base font-medium text-gray-800">Tasks & Points</h3>
        </div>
        <p className="text-sm text-gray-600">
          Each task you complete contributes 1 point toward its associated goal. Complete tasks to make progress on your
          big goals!
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
          <p className="italic font-medium">"The future depends on what you do today."</p>
          <p className="mt-2">Add your first task to get started.</p>
        </div>
      ) : (
        <div className="text-center py-3 text-gray-500 mb-6 italic font-medium">
          "The future depends on what you do today."
        </div>
      )}

      {/* Urgent & Important */}
      <div className="mb-8">
        <h3 className="text-base font-medium border-l-4 border-red-500 pl-3 py-1 mb-3 flex items-center">
          <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs mr-2">Priority 1</span>
          Urgent and Important
        </h3>
        <div className="space-y-3">
          {getPriorityTasks("urgent-important").length === 0 ? (
            <div className="text-sm text-gray-400 py-3 pl-3 bg-gray-50 rounded-md border border-dashed">
              No tasks in this category
            </div>
          ) : (
            getPriorityTasks("urgent-important").map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                goalTitle={getGoalTitle(task.goalId)}
                onToggleComplete={handleToggleComplete}
                onMoveTask={handleMoveTask}
                pointsContribution={getPointsContribution(task)}
              />
            ))
          )}
        </div>
      </div>

      {/* Urgent but Not Important */}
      <div className="mb-8">
        <h3 className="text-base font-medium border-l-4 border-orange-500 pl-3 py-1 mb-3 flex items-center">
          <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs mr-2">Priority 2</span>
          Urgent but Not Important
        </h3>
        <div className="space-y-3">
          {getPriorityTasks("urgent-not-important").length === 0 ? (
            <div className="text-sm text-gray-400 py-3 pl-3 bg-gray-50 rounded-md border border-dashed">
              No tasks in this category
            </div>
          ) : (
            getPriorityTasks("urgent-not-important").map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                goalTitle={getGoalTitle(task.goalId)}
                onToggleComplete={handleToggleComplete}
                onMoveTask={handleMoveTask}
                pointsContribution={getPointsContribution(task)}
              />
            ))
          )}
        </div>
      </div>

      {/* Important but Not Urgent */}
      <div className="mb-8">
        <h3 className="text-base font-medium border-l-4 border-blue-500 pl-3 py-1 mb-3 flex items-center">
          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs mr-2">Priority 3</span>
          Important but Not Urgent
        </h3>
        <div className="space-y-3">
          {getPriorityTasks("important-not-urgent").length === 0 ? (
            <div className="text-sm text-gray-400 py-3 pl-3 bg-gray-50 rounded-md border border-dashed">
              No tasks in this category
            </div>
          ) : (
            getPriorityTasks("important-not-urgent").map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                goalTitle={getGoalTitle(task.goalId)}
                onToggleComplete={handleToggleComplete}
                onMoveTask={handleMoveTask}
                pointsContribution={getPointsContribution(task)}
              />
            ))
          )}
        </div>
      </div>

      {/* Neither */}
      <div>
        <h3 className="text-base font-medium border-l-4 border-gray-400 pl-3 py-1 mb-3 flex items-center">
          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs mr-2">Priority 4</span>
          Neither Urgent nor Important
        </h3>
        <div className="space-y-3">
          {getPriorityTasks("neither").length === 0 ? (
            <div className="text-sm text-gray-400 py-3 pl-3 bg-gray-50 rounded-md border border-dashed">
              No tasks in this category
            </div>
          ) : (
            getPriorityTasks("neither").map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                goalTitle={getGoalTitle(task.goalId)}
                onToggleComplete={handleToggleComplete}
                onMoveTask={handleMoveTask}
                pointsContribution={getPointsContribution(task)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface TaskItemProps {
  task: Task
  goalTitle: string
  onToggleComplete: (taskId: string) => void
  onMoveTask: (taskId: string, direction: "up" | "down") => void
  pointsContribution: number | null
}

// Update the TaskItem component to show a linked indicator
function TaskItem({ task, goalTitle, onToggleComplete, onMoveTask, pointsContribution }: TaskItemProps) {
  const isLinkedToStep = !!task.sourceStepId

  // Update the TaskItem component styling
  return (
    <div
      className={`border rounded-lg p-3 flex items-start shadow-sm hover:shadow transition-all duration-200 ${
        task.completed ? "bg-gray-50" : "bg-white"
      }`}
    >
      <div className="flex-shrink-0 mr-3 pt-1">
        <button
          onClick={() => onToggleComplete(task.id)}
          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
            task.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          {task.completed && <Check className="h-3 w-3" />}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <div className={`text-sm font-medium ${task.completed ? "line-through text-gray-500" : "text-gray-800"}`}>
            {task.title}
          </div>
          {isLinkedToStep && (
            <span className="ml-2 px-2 py-0.5 text-[10px] bg-blue-100 text-blue-700 rounded-full font-medium">
              Linked
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center mt-1.5 text-xs text-gray-500 gap-2">
          <div className="flex items-center bg-gray-100 px-1.5 py-0.5 rounded-full">
            <Clock className="h-3 w-3 mr-1" />
            {task.timeEstimate} min
          </div>

          <div className="flex items-center bg-blue-50 px-1.5 py-0.5 rounded-full">
            <Link className="h-3 w-3 mr-1 text-blue-500" />
            <span className="text-blue-600">{goalTitle}</span>
          </div>

          {task.tags.length > 0 && (
            <div className="flex items-center bg-purple-50 px-1.5 py-0.5 rounded-full">
              <Tag className="h-3 w-3 mr-1 text-purple-500" />
              <span className="text-purple-600">{task.tags.join(", ")}</span>
            </div>
          )}

          {pointsContribution && (
            <div className="flex items-center bg-amber-50 px-1.5 py-0.5 rounded-full">
              <Star className="h-3 w-3 mr-1 text-amber-400" />
              <span className="text-amber-600">+{pointsContribution} point</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col ml-2">
        <button
          onClick={() => onMoveTask(task.id, "up")}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-1"
          title="Move to higher priority"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          onClick={() => onMoveTask(task.id, "down")}
          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded p-1"
          title="Move to lower priority"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

