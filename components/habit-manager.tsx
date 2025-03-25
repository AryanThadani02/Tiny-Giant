"use client"

import { useState, useEffect } from "react"
import { Plus, X, Calendar, Star, Target, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import type { Habit, HabitWithGoals } from "@/types/habit"
import type { Goal } from "@/types/step"

interface HabitManagerProps {
  goals: Goal[]
  onPointsUpdated: () => void
}

export function HabitManager({ goals, onPointsUpdated }: HabitManagerProps) {
  const [habits, setHabits] = useState<Habit[]>([])
  const [habitsWithGoals, setHabitsWithGoals] = useState<HabitWithGoals[]>([])
  const [addHabitOpen, setAddHabitOpen] = useState(false)
  const [newHabit, setNewHabit] = useState<{
    title: string
    description: string
    goalIds: string[]
  }>({
    title: "",
    description: "",
    goalIds: [],
  })

  // Load habits from localStorage on initial render
  useEffect(() => {
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

  // Save habits to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("tiny-giant-habits", JSON.stringify(habits))
    } catch (error) {
      console.error("Error saving habits:", error)
    }
  }, [habits])

  // Populate habits with their associated goals
  useEffect(() => {
    const populatedHabits = habits.map((habit) => {
      const associatedGoals = goals.filter((goal) => habit.goalIds.includes(goal.id))
      return {
        ...habit,
        goals: associatedGoals,
      }
    })
    setHabitsWithGoals(populatedHabits)
  }, [habits, goals])

  // Get today's date in YYYY-MM-DD format
  const getTodayDateString = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  // Check if a habit has been completed today
  const isCompletedToday = (habit: Habit) => {
    const todayString = getTodayDateString()
    return habit.completions.some((completion) => completion.date === todayString)
  }

  // Handle habit completion toggle
  const toggleHabitCompletion = (habitId: string) => {
    const todayString = getTodayDateString()
    const habitIndex = habits.findIndex((h) => h.id === habitId)

    if (habitIndex === -1) return

    const habit = habits[habitIndex]
    const isCompleted = isCompletedToday(habit)

    let updatedHabit: Habit

    if (isCompleted) {
      // Remove today's completion
      updatedHabit = {
        ...habit,
        completions: habit.completions.filter((completion) => completion.date !== todayString),
      }
      toast({
        title: "Habit unmarked",
        description: `You've unmarked "${habit.title}" for today.`,
        duration: 3000,
      })
    } else {
      // Add today's completion
      updatedHabit = {
        ...habit,
        completions: [
          ...habit.completions,
          {
            date: todayString,
            timestamp: Date.now(),
          },
        ],
      }
      toast({
        title: "Habit completed",
        description: `You've completed "${habit.title}" for today!`,
        duration: 3000,
      })
    }

    const updatedHabits = [...habits]
    updatedHabits[habitIndex] = updatedHabit
    setHabits(updatedHabits)

    // Update points for associated goals
    updateGoalPoints(habit, !isCompleted)
  }

  // Update goal points when a habit is completed or uncompleted
  const updateGoalPoints = (habit: Habit, completed: boolean) => {
    // Each habit contributes 0.25 points to each associated goal
    const pointChange = completed ? habit.pointValue : -habit.pointValue

    // Call the parent component's onPointsUpdated to trigger a recalculation
    onPointsUpdated()
  }

  // Handle adding a new habit
  const handleAddHabit = () => {
    if (!newHabit.title.trim()) {
      toast({
        title: "Error",
        description: "Habit title is required",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    const newHabitObj: Habit = {
      id: Date.now().toString(),
      title: newHabit.title.trim(),
      description: newHabit.description.trim(),
      goalIds: newHabit.goalIds,
      completions: [],
      createdAt: Date.now(),
      pointValue: 0.25, // Default point value
    }

    setHabits((prev) => [...prev, newHabitObj])
    setNewHabit({
      title: "",
      description: "",
      goalIds: [],
    })
    setAddHabitOpen(false)

    toast({
      title: "Habit added",
      description: `"${newHabitObj.title}" has been added to your habits.`,
      duration: 3000,
    })
  }

  // Handle deleting a habit
  const handleDeleteHabit = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId)
    if (!habit) return

    // Remove the habit
    setHabits((prev) => prev.filter((h) => h.id !== habitId))

    toast({
      title: "Habit deleted",
      description: `"${habit.title}" has been removed from your habits.`,
      duration: 3000,
    })
  }

  // Toggle goal selection for a new habit
  const toggleGoalSelection = (goalId: string) => {
    if (newHabit.goalIds.includes(goalId)) {
      setNewHabit({
        ...newHabit,
        goalIds: newHabit.goalIds.filter((id) => id !== goalId),
      })
    } else {
      setNewHabit({
        ...newHabit,
        goalIds: [...newHabit.goalIds, goalId],
      })
    }
  }

  // Get streak for a habit (consecutive days completed)
  const getHabitStreak = (habit: Habit) => {
    if (habit.completions.length === 0) return 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Sort completions by date (newest first)
    const sortedCompletions = [...habit.completions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    // Check if completed today
    const todayString = getTodayDateString()
    const completedToday = sortedCompletions[0]?.date === todayString

    if (!completedToday) return 0

    let streak = 1
    let currentDate = today

    // Go back one day at a time and check if the habit was completed
    for (let i = 1; i < 365; i++) {
      currentDate = new Date(today)
      currentDate.setDate(currentDate.getDate() - i)

      const dateString = currentDate.toISOString().split("T")[0]
      const wasCompleted = habit.completions.some((completion) => completion.date === dateString)

      if (wasCompleted) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-md border">
        <div className="flex items-center mb-2">
          <Calendar className="h-5 w-5 mr-2 text-purple-500" />
          <h3 className="text-base font-medium text-gray-800">Daily Habits</h3>
        </div>
        <p className="text-sm text-gray-600">
          Build consistency with daily habits. Each completed habit contributes 0.25 points to its associated goals.
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Your Habits</h3>
        <Button
          onClick={() => setAddHabitOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 rounded-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Habit
        </Button>
      </div>

      {habitsWithGoals.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
          <p className="italic font-medium">
            "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
          </p>
          <p className="mt-2">Add your first habit to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {habitsWithGoals.map((habit) => (
            <div key={habit.id} className="border rounded-lg p-4 shadow-sm hover:shadow transition-all duration-200">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-3">
                  <Checkbox
                    id={`habit-${habit.id}`}
                    checked={isCompletedToday(habit)}
                    onCheckedChange={() => toggleHabitCompletion(habit.id)}
                    className="h-5 w-5 rounded-full data-[state=checked]:bg-purple-500 data-[state=checked]:text-white"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <label htmlFor={`habit-${habit.id}`} className="text-base font-medium text-gray-800 cursor-pointer">
                      {habit.title}
                    </label>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {habit.description && <p className="text-sm text-gray-600 mt-1">{habit.description}</p>}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Streak badge */}
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Calendar className="h-3 w-3 mr-1" />
                      Streak: {getHabitStreak(habit)}
                    </Badge>

                    {/* Points badge */}
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      <Star className="h-3 w-3 mr-1" />
                      {habit.pointValue} points per day
                    </Badge>

                    {/* Associated goals */}
                    {habit.goals.map((goal) => (
                      <Badge key={goal.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Target className="h-3 w-3 mr-1" />
                        {goal.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Habit Dialog */}
      <Dialog open={addHabitOpen} onOpenChange={setAddHabitOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Habit</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="habit-title">Habit Title</Label>
              <Input
                id="habit-title"
                placeholder="e.g., Drink 8 glasses of water"
                value={newHabit.title}
                onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="habit-description">Description (Optional)</Label>
              <Textarea
                id="habit-description"
                placeholder="Why is this habit important to you?"
                value={newHabit.description}
                onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Associated Goals</Label>
              <div className="border rounded-md p-3 max-h-[200px] overflow-y-auto">
                {goals.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    You don't have any goals yet. Add goals to associate them with this habit.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {goals.map((goal) => (
                      <div key={goal.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`goal-${goal.id}`}
                          checked={newHabit.goalIds.includes(goal.id)}
                          onCheckedChange={() => toggleGoalSelection(goal.id)}
                        />
                        <label
                          htmlFor={`goal-${goal.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {goal.title}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-md flex items-start">
              <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700">
                Each completed habit contributes 0.25 points to each associated goal. Build consistency to make progress
                on your goals!
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddHabitOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddHabit} className="bg-purple-600 hover:bg-purple-700">
              Add Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

