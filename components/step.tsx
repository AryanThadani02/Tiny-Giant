import { Checkbox } from "@/components/ui/checkbox"

export interface StepType {
  id: string
  text: string
  completed: boolean
}

interface StepProps {
  step: StepType
  onToggle: (id: string, completed: boolean) => void
}

export function Step({ step, onToggle }: StepProps) {
  const handleToggle = () => {
    onToggle(step.id, !step.completed)
  }

  return (
    <div className="flex items-start space-x-2 py-1">
      <Checkbox id={`step-${step.id}`} checked={step.completed} onCheckedChange={handleToggle} className="mt-0.5" />
      <label
        htmlFor={`step-${step.id}`}
        className={`text-xs ${step.completed ? "line-through text-gray-400" : "text-gray-600"}`}
      >
        {step.text}
      </label>
    </div>
  )
}

