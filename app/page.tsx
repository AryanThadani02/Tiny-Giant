"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Plus, Star, CheckCircle2, Calendar } from "lucide-react"
import { AddGoalDialog } from "@/components/add-goal-dialog"
import { CompactGoalCard } from "@/components/compact-goal-card"
import { ExpandedGoalView } from "@/components/expanded-goal-view"
import { TaskManager, type Task, type TaskPriority } from "@/components/task-manager"
import type { Goal, Milestone, Step } from "@/types/step"
import type { Habit } from "@/types/habit"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { Toaster } from "@/components/ui/toaster"
import { AddTaskDialog } from "@/components/add-task-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"

// Define goal colors
const GOAL_COLORS = [
  "#4F6BF4", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EC4899", // Pink
  "#8B5CF6", // Purple
]

// Default milestone bonus points
const DEFAULT_MILESTONE_BONUS = 50

export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [habits, setHabits] = useState<Habit[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [goalDialogOpen, setGoalDialogOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null)
  const [isGeneratingMilestones, setIsGeneratingMilestones] = useState(false)
  const [isSynchronizing, setIsSynchronizing] = useState(false)
  const [activeTab, setActiveTab] = useState("goals")

  // Load goals from localStorage on initial render
  useEffect(() => {
    const savedGoals = localStorage.getItem("tiny-giant-goals")
    if (savedGoals) {
      try {
        const parsedGoals = JSON.parse(savedGoals)

        // Convert old format to new format with points system
        const updatedGoals = parsedGoals.map((goal: any) => {
          // Set default total points
          const totalPoints = goal.totalPoints || 50

          // Calculate current points based on completed tasks
          const completedTasksCount = tasks.filter((t) => t.goalId === goal.id && t.completed).length

          // Calculate bonus points from completed milestones
          const milestoneBonus = goal.milestones
            ? goal.milestones
                .filter((m: any) => m.completed)
                .reduce((sum: number, m: any) => sum + (m.bonusPoints || DEFAULT_MILESTONE_BONUS), 0)
            : 0

          // Set current points
          const currentPoints = Math.min(completedTasksCount + milestoneBonus, totalPoints)

          // Ensure milestones have bonus points
          const updatedMilestones = goal.milestones
            ? goal.milestones.map((m: any) => ({
                ...m,
                bonusPoints: m.bonusPoints || DEFAULT_MILESTONE_BONUS,
                steps: m.steps || [],
              }))
            : []

          return {
            ...goal,
            totalPoints,
            currentPoints,
            milestones: updatedMilestones,
          }
        })

        setGoals(updatedGoals)
      } catch (error) {
        console.error("Error loading goals:", error)
        localStorage.removeItem("tiny-giant-goals")
      }
    }

    // Load tasks
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

    // Load habits
    const savedHabits = localStorage.getItem("tiny-giant-habits")
    if (savedHabits) {
      try {
        const parsedHabits = JSON.parse(savedHabits)
        setHabits(parsedHabits)
      } catch (error) {
        console.error("Error loading habits:", error)
        localStorage.removeItem("tiny-giant-habits")
      }
    }
  }, [])

  // Save goals to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("tiny-giant-goals", JSON.stringify(goals))
    } catch (error) {
      console.error("Error saving goals:", error)
    }
  }, [goals])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("tiny-giant-tasks", JSON.stringify(tasks))
    } catch (error) {
      console.error("Error saving tasks:", error)
    }
  }, [tasks])

  // Save habits to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("tiny-giant-habits", JSON.stringify(habits))
    } catch (error) {
      console.error("Error saving habits:", error)
    }
  }, [habits])

  // Get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  // Update goal points whenever tasks or habits change
  useEffect(() => {
    if (isSynchronizing) return

    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        // Count completed tasks for this goal
        const completedTasksCount = tasks.filter((t) => t.goalId === goal.id && t.completed).length

        // Count completed steps that aren't linked to tasks
        let completedStepsCount = 0
        goal.milestones.forEach((milestone) => {
          if (milestone.steps) {
            milestone.steps.forEach((step) => {
              // Only count completed steps that don't have a linked task
              const hasLinkedTask = tasks.some(
                (task) =>
                  task.sourceStepId === step.id && task.sourceMilestoneId === milestone.id && task.goalId === goal.id,
              )

              if (step.completed && !hasLinkedTask) {
                completedStepsCount++
              }
            })
          }
        })

        // Calculate bonus points from completed milestones
        const milestoneBonus = goal.milestones
          .filter((m) => m.completed)
          .reduce((sum, m) => sum + (m.bonusPoints || DEFAULT_MILESTONE_BONUS), 0)

        // Calculate habit points (0.25 points per completed habit per day)
        const todayString = getTodayDateString()
        let habitPoints = 0

        habits.forEach((habit) => {
          // Check if habit is associated with this goal and completed today
          if (
            habit.goalIds.includes(goal.id) &&
            habit.completions.some((completion) => completion.date === todayString)
          ) {
            habitPoints += habit.pointValue
          }
        })

        // Calculate current points (tasks + steps + milestone bonuses + habits)
        const currentPoints = Math.min(
          completedTasksCount + completedStepsCount + milestoneBonus + habitPoints,
          goal.totalPoints || 50,
        )

        // Only update if points have changed to avoid unnecessary re-renders
        if (currentPoints !== goal.currentPoints) {
          return {
            ...goal,
            currentPoints,
          }
        }
        return goal
      }),
    )
  }, [tasks, habits, isSynchronizing]) // Remove goals dependency

  // Update the handleAddGoal function
  const handleAddGoal = (goal: Goal) => {
    // Ensure the goal has the point system properties
    const newGoal: Goal = {
      ...goal,
      totalPoints: goal.totalPoints || 50,
      currentPoints: 0,
      milestones: goal.milestones.map((m) => ({
        ...m,
        bonusPoints: DEFAULT_MILESTONE_BONUS,
      })),
    }

    setGoals((prev) => [...prev, newGoal])
  }

  // Handle milestone toggle
  const handleMilestoneToggle = (goalId: string, milestoneId: string, completed: boolean) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          // Find the milestone
          const milestone = g.milestones.find((m) => m.id === milestoneId)
          if (!milestone) return g

          // Calculate the point change
          const pointChange = completed ? milestone.bonusPoints : -milestone.bonusPoints

          // Calculate new current points
          const newCurrentPoints = Math.min(Math.max(0, g.currentPoints + pointChange), g.totalPoints || 500)

          return {
            ...g,
            currentPoints: newCurrentPoints,
            milestones: g.milestones.map((m) => {
              if (m.id === milestoneId) {
                return {
                  ...m,
                  completed,
                  completedAt: completed ? Date.now() : undefined,
                }
              }
              return m
            }),
          }
        }
        return g
      }),
    )
  }

  // Handle milestone add
  const handleMilestoneAdd = (goalId: string, milestone: Milestone) => {
    // Ensure the milestone has bonus points
    const newMilestone: Milestone = {
      ...milestone,
      bonusPoints: milestone.bonusPoints || DEFAULT_MILESTONE_BONUS,
    }

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            milestones: [...g.milestones, newMilestone],
          }
        }
        return g
      }),
    )
  }

  // Handle milestone update
  const handleMilestoneUpdate = (goalId: string, milestoneId: string, title: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            milestones: g.milestones.map((m) => {
              if (m.id === milestoneId) {
                return {
                  ...m,
                  title,
                }
              }
              return m
            }),
          }
        }
        return g
      }),
    )
  }

  // Handle milestone delete
  const handleMilestoneDelete = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          // Find the milestone
          const milestone = g.milestones.find((m) => m.id === milestoneId)
          if (!milestone) return g

          // If the milestone was completed, subtract its bonus points
          const pointChange = milestone.completed ? -milestone.bonusPoints : 0

          // Calculate new current points
          const newCurrentPoints = Math.max(0, g.currentPoints + pointChange)

          return {
            ...g,
            currentPoints: newCurrentPoints,
            milestones: g.milestones.filter((m) => m.id !== milestoneId),
          }
        }
        return g
      }),
    )
  }

  // Add a function to handle adding a step to a milestone
  const handleAddStep = (goalId: string, milestoneId: string) => {
    console.log("Main page adding step:", { goalId, milestoneId })

    // Create a new empty step
    const newStep: Step = {
      id: Date.now().toString(),
      text: "New step",
      completed: false,
      timeEstimate: 30,
      notes: "",
    }

    setGoals((prev) => {
      const updatedGoals = prev.map((g) => {
        if (g.id === goalId) {
          const updatedMilestones = g.milestones.map((m) => {
            if (m.id === milestoneId) {
              // Ensure steps array exists before spreading
              const existingSteps = Array.isArray(m.steps) ? m.steps : []
              return {
                ...m,
                steps: [...existingSteps, newStep],
              }
            }
            return m
          })

          return {
            ...g,
            milestones: updatedMilestones,
          }
        }
        return g
      })

      console.log("Updated goals after adding step:", updatedGoals)
      return updatedGoals
    })
  }

  // Handle adding generated steps to a milestone
  const handleAddGeneratedSteps = (goalId: string, milestoneId: string, steps: Step[]) => {
    console.log("Adding generated steps:", { goalId, milestoneId, steps })

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            milestones: g.milestones.map((m) => {
              if (m.id === milestoneId) {
                // Ensure steps array exists before spreading
                const existingSteps = m.steps || []
                return {
                  ...m,
                  steps: [...existingSteps, ...steps],
                }
              }
              return m
            }),
          }
        }
        return g
      }),
    )
  }

  const handleGenerateMilestones = async (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) return

    setIsGeneratingMilestones(true)

    try {
      const response = await fetch("/api/generate-milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goal: goal.title,
          purpose: goal.purpose,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate milestones")

      const data = await response.json()

      if (data.milestones && data.milestones.length > 0) {
        // Create milestone objects from the strings
        const newMilestones = data.milestones.map((title: string) => ({
          id: Date.now() + "-" + Math.random().toString(36).substring(2, 9),
          title,
          completed: false,
          steps: [],
          bonusPoints: DEFAULT_MILESTONE_BONUS,
        }))

        setGoals((prev) =>
          prev.map((g) => {
            if (g.id === goalId) {
              return {
                ...g,
                milestones: [...g.milestones, ...newMilestones],
              }
            }
            return g
          }),
        )
      }
    } catch (error) {
      console.error("Error generating milestones:", error)
    } finally {
      setIsGeneratingMilestones(false)
    }
  }

  const handleDeleteGoal = (goalId: string) => {
    setGoalToDelete(goalId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteGoal = () => {
    if (goalToDelete) {
      setGoals((prev) => prev.filter((goal) => goal.id !== goalToDelete))
      setSelectedGoalId(null)
      setGoalToDelete(null)
    }
  }

  // Update the handleToggleTaskComplete function to sync with steps
  const handleToggleTaskComplete = (taskId: string) => {
    // Find the task
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const newCompletionState = !task.completed
    setIsSynchronizing(true)

    // Update the task completion status
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: newCompletionState,
              completedAt: newCompletionState ? Date.now() : undefined,
            }
          : t,
      ),
    )

    // If this task is associated with a step, update the step's completion status
    if (task.sourceStepId && task.sourceMilestoneId && task.goalId !== "adhoc") {
      setGoals((prev) =>
        prev.map((goal) => {
          if (goal.id === task.goalId) {
            return {
              ...goal,
              milestones: goal.milestones.map((milestone) => {
                if (milestone.id === task.sourceMilestoneId) {
                  return {
                    ...milestone,
                    steps: milestone.steps.map((step) => {
                      if (step.id === task.sourceStepId) {
                        return {
                          ...step,
                          completed: newCompletionState,
                          completedAt: newCompletionState ? Date.now() : undefined,
                        }
                      }
                      return step
                    }),
                  }
                }
                return milestone
              }),
            }
          }
          return goal
        }),
      )
    }

    // Reset synchronizing flag after a short delay
    setTimeout(() => setIsSynchronizing(false), 100)

    if (task.sourceStepId && task.sourceMilestoneId && newCompletionState) {
      toast({
        title: "Step updated",
        description: "The linked step has also been marked as complete.",
        duration: 3000,
      })
    }
  }

  // Update the handleMoveTask function to match the expected signature
  const handleMoveTask = (taskId: string, direction: "up" | "down") => {
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

  // Update the handleAddTask function to include a timestamp
  const handleAddTask = (task: Task) => {
    // Ensure the task has an ID if not already provided
    const taskWithId = {
      ...task,
      id: task.id || Date.now().toString(),
    }

    setTasks((prev) => [...prev, taskWithId])
    setTaskDialogOpen(false)
  }

  // Add a function to update goal points
  const handleUpdateGoalPoints = (goalId: string, points: number) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          return {
            ...goal,
            totalPoints: points,
          }
        }
        return goal
      }),
    )
  }

  // Handle step toggle
  const handleStepToggle = (milestoneId: string, stepId: string, completed: boolean) => {
    console.log("Toggling step:", { milestoneId, stepId, completed })

    // Find if this step has a linked task
    const linkedTask = tasks.find(
      (task) =>
        task.sourceStepId === stepId && task.sourceMilestoneId === milestoneId && task.goalId === selectedGoalId,
    )

    // If there's a linked task, update it first
    if (linkedTask) {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === linkedTask.id) {
            return {
              ...task,
              completed,
              completedAt: completed ? Date.now() : undefined,
            }
          }
          return task
        }),
      )

      // Show toast notification if a task was updated
      if (completed) {
        toast({
          title: "Task updated",
          description: "The linked task has also been marked as complete.",
          duration: 3000,
        })
      }

      // The useEffect will handle updating the goal points
      return
    }

    // If no linked task, update the step and goal points directly
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === selectedGoalId) {
          // Calculate point change for this step completion
          const pointChange = completed ? 1 : -1 // Each step is worth 1 point

          // Calculate new current points
          const newCurrentPoints = Math.min(Math.max(0, g.currentPoints + pointChange), g.totalPoints || 50)

          return {
            ...g,
            currentPoints: newCurrentPoints, // Update the current points
            milestones: g.milestones.map((m) => {
              if (m.id === milestoneId) {
                return {
                  ...m,
                  steps: m.steps.map((s) => {
                    if (s.id === stepId) {
                      return {
                        ...s,
                        completed,
                      }
                    }
                    return s
                  }),
                }
              }
              return m
            }),
          }
        }
        return g
      }),
    )
  }

  // Handle updating a step
  const handleUpdateStep = (
    goalId: string,
    milestoneId: string,
    stepId: string,
    text: string,
    timeEstimate: number,
  ) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            milestones: g.milestones.map((m) => {
              if (m.id === milestoneId) {
                return {
                  ...m,
                  steps: m.steps.map((s) => {
                    if (s.id === stepId) {
                      return {
                        ...s,
                        text,
                        timeEstimate,
                      }
                    }
                    return s
                  }),
                }
              }
              return m
            }),
          }
        }
        return g
      }),
    )
  }

  // Handle deleting a step
  const handleDeleteStep = (goalId: string, milestoneId: string, stepId: string) => {
    console.log("Deleting step:", { goalId, milestoneId, stepId })

    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            milestones: g.milestones.map((m) => {
              if (m.id === milestoneId) {
                return {
                  ...m,
                  steps: m.steps.filter((s) => s.id !== stepId),
                }
              }
              return m
            }),
          }
        }
        return g
      }),
    )
  }

  // Handle habit points update
  const handleHabitPointsUpdated = () => {
    // This function is called when habits are completed or uncompleted
    // The useEffect will handle recalculating the points
    setIsSynchronizing(true)
    setTimeout(() => setIsSynchronizing(false), 100)
  }

  const selectedGoal = goals.find((goal) => goal.id === selectedGoalId)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 container px-4 py-6">
        {/* Update the Tabs and TabsList components with better styling */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full mb-6 bg-white border shadow-sm rounded-lg overflow-hidden">
            <TabsTrigger
              value="goals"
              className="flex-1 py-3 text-sm font-medium transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <div className="flex items-center justify-center space-x-2">
                <Star className="h-4 w-4" />
                <span>Big Goals</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="flex-1 py-3 text-sm font-medium transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Tiny Tasks</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="habits"
              className="flex-1 py-3 text-sm font-medium transition-all data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              <div className="flex items-center justify-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Daily Habits</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Goals Tab */}
          <TabsContent value="goals" className="focus:outline-none">
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <h2 className="text-xl font-semibold text-gray-800">Your Big Goals</h2>
              <Button
                onClick={() => setGoalDialogOpen(true)}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 rounded-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Big Goal
              </Button>
            </div>

            {goals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border">
                <p className="text-gray-500">You haven't added any big goals yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => setGoalDialogOpen(true)}>
                  Add your first big goal
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {goals.map((goal, index) => (
                    <CompactGoalCard
                      key={goal.id}
                      goal={goal}
                      tasks={tasks}
                      isSelected={goal.id === selectedGoalId}
                      onSelect={() => setSelectedGoalId(goal.id === selectedGoalId ? null : goal.id)}
                      progressColor={GOAL_COLORS[index % GOAL_COLORS.length]}
                      onConvertStepToTask={(milestoneId, step, goalId, goalTitle) => {
                        // Create a new task from the step
                        const newTask: Task = {
                          id: Date.now().toString(),
                          title: step.text,
                          timeEstimate: step.timeEstimate,
                          priority: "important-not-urgent",
                          completed: false,
                          tags: [],
                          goalId: goalId,
                          sourceStepId: step.id,
                          sourceMilestoneId: milestoneId,
                        }

                        handleAddTask(newTask)

                        toast({
                          title: "Step added to tasks",
                          description: `"${step.text}" has been added to your tasks.`,
                          duration: 3000,
                        })
                      }}
                    />
                  ))}
                </div>

                {selectedGoal && (
                  <ExpandedGoalView
                    goal={selectedGoal}
                    onClose={() => setSelectedGoalId(null)}
                    onMilestoneToggle={handleMilestoneToggle}
                    onGenerateMilestones={handleGenerateMilestones}
                    onUpdateGoalPoints={handleUpdateGoalPoints}
                    onStepToggle={handleStepToggle}
                    onAddStep={handleAddStep}
                    onAddGeneratedSteps={handleAddGeneratedSteps}
                    onUpdateStep={handleUpdateStep}
                    onDeleteStep={handleDeleteStep}
                    onAddTask={handleAddTask}
                    isGeneratingMilestones={isGeneratingMilestones}
                    tasks={tasks}
                  />
                )}
              </>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="focus:outline-none">
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
              <h2 className="text-xl font-semibold text-gray-800">Your Tiny Tasks</h2>
              <Button
                onClick={() => setTaskDialogOpen(true)}
                className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-200 rounded-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Tiny Task
              </Button>
            </div>

            <TaskManager
              goals={goals}
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleComplete={handleToggleTaskComplete}
              onMoveTask={handleMoveTask}
            />
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits" className="focus:outline-none">
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
              <h2 className="text-xl font-semibold text-gray-800">Your Daily Habits</h2>
            </div>

            <div className="bg-white rounded-lg border shadow-sm p-12 text-center">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Coming Soon</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                We're working on bringing daily habit tracking to help you build consistency and make progress on your
                goals.
              </p>
              <div className="w-full max-w-md mx-auto h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-3/4"></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">75% complete</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AddGoalDialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen} onAddGoal={handleAddGoal} />
      <AddTaskDialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen} onAddTask={handleAddTask} goals={goals} />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteGoal}
        title="Delete Goal"
        description="Are you sure you want to delete this goal? This action cannot be undone."
      />

      <Toaster />
    </div>
  )
}

