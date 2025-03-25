import { format } from "date-fns"
import { CheckCircle2, ArrowRight, GitPullRequest, GitCommit } from "lucide-react"
import type { Step } from "@/types/step"
import type { Task } from "@/components/task-manager"

interface TimelineEvent {
  id: string
  type: "step-completed" | "step-added" | "task-completed" | "task-added" | "step-to-task"
  timestamp: number
  title: string
  description?: string
  goalId: string
}

interface ActivityTimelineProps {
  events: TimelineEvent[]
  maxItems?: number
}

export function ActivityTimeline({ events, maxItems = 10 }: ActivityTimelineProps) {
  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, maxItems)

  if (sortedEvents.length === 0) {
    return <div className="text-sm text-gray-500 py-2">No recent activity for this goal.</div>
  }

  return (
    <div className="relative pl-8 mt-2">
      {/* Vertical timeline line */}
      <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-blue-200"></div>

      {sortedEvents.map((event, index) => (
        <div key={event.id} className="relative mb-4 last:mb-0">
          {/* Timeline dot */}
          <div
            className={`absolute left-[-18px] top-1 w-6 h-6 rounded-full flex items-center justify-center ${getEventColor(event.type)}`}
          >
            {getEventIcon(event.type)}
          </div>

          {/* Event content */}
          <div className="pb-2">
            <div className="font-medium text-sm">{event.title}</div>
            {event.description && <div className="text-xs text-gray-600 mt-0.5">{event.description}</div>}
            <div className="text-xs text-gray-500 mt-1">{format(event.timestamp, "MMM d, yyyy 'at' h:mm a")}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Helper functions to determine event styling
function getEventColor(type: TimelineEvent["type"]): string {
  switch (type) {
    case "step-completed":
      return "bg-green-100 text-green-600 border border-green-300"
    case "step-added":
      return "bg-blue-100 text-blue-600 border border-blue-300"
    case "task-completed":
      return "bg-purple-100 text-purple-600 border border-purple-300"
    case "task-added":
      return "bg-indigo-100 text-indigo-600 border border-indigo-300"
    case "step-to-task":
      return "bg-amber-100 text-amber-600 border border-amber-300"
    default:
      return "bg-gray-100 text-gray-600 border border-gray-300"
  }
}

function getEventIcon(type: TimelineEvent["type"]) {
  switch (type) {
    case "step-completed":
      return <CheckCircle2 className="h-3 w-3" />
    case "step-added":
      return <GitCommit className="h-3 w-3" />
    case "task-completed":
      return <CheckCircle2 className="h-3 w-3" />
    case "task-added":
      return <GitPullRequest className="h-3 w-3" />
    case "step-to-task":
      return <ArrowRight className="h-3 w-3" />
    default:
      return <GitCommit className="h-3 w-3" />
  }
}

// Helper function to generate timeline events from steps and tasks
export function generateTimelineEvents(
  goalId: string,
  goalTitle: string,
  steps: Step[],
  tasks: Task[],
): TimelineEvent[] {
  const events: TimelineEvent[] = []

  // Add step events
  steps.forEach((step) => {
    // Step creation event (using step ID as a timestamp approximation if not available)
    const stepCreationTime = Number(step.id) || Date.now()
    events.push({
      id: `step-added-${step.id}`,
      type: "step-added",
      timestamp: stepCreationTime,
      title: `Added step: ${step.text}`,
      goalId,
    })

    // Step completion event
    if (step.completed && step.completedAt) {
      events.push({
        id: `step-completed-${step.id}`,
        type: "step-completed",
        timestamp: step.completedAt,
        title: `Completed step: ${step.text}`,
        goalId,
      })
    }
  })

  // Add task events related to this goal
  tasks
    .filter((task) => task.goalId === goalId)
    .forEach((task) => {
      // Find if this task was converted from a step
      const matchingStep = steps.find((step) => step.text.toLowerCase().trim() === task.title.toLowerCase().trim())

      if (matchingStep) {
        // This task was likely converted from a step
        events.push({
          id: `step-to-task-${task.id}`,
          type: "step-to-task",
          timestamp: Number(task.id) || Date.now(), // Use task ID as timestamp approximation
          title: `Converted to task: ${task.title}`,
          description: `Added to task list from goal "${goalTitle}"`,
          goalId,
        })
      } else {
        // Regular task creation
        events.push({
          id: `task-added-${task.id}`,
          type: "task-added",
          timestamp: Number(task.id) || Date.now(),
          title: `Added task: ${task.title}`,
          goalId,
        })
      }

      // Task completion event
      if (task.completed && task.completedAt) {
        events.push({
          id: `task-completed-${task.id}`,
          type: "task-completed",
          timestamp: task.completedAt,
          title: `Completed task: ${task.title}`,
          goalId,
        })
      }
    })

  return events
}

