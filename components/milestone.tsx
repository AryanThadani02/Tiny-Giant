"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Edit2, Save, X } from "lucide-react"

export interface MilestoneType {
  id: string
  title: string
  completed: boolean
}

interface MilestoneProps {
  milestone: MilestoneType
  onToggle: (id: string, completed: boolean) => void
  onUpdate: (id: string, text: string) => void
}

export function Milestone({ milestone, onToggle, onUpdate }: MilestoneProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(milestone.title)

  const handleToggle = () => {
    onToggle(milestone.id, !milestone.completed)
  }

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onUpdate(milestone.id, editText)
      setEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditText(milestone.title)
    setEditing(false)
  }

  return (
    <div className="flex items-start space-x-2 py-2">
      <Checkbox
        id={`milestone-${milestone.id}`}
        checked={milestone.completed}
        onCheckedChange={handleToggle}
        className="mt-0.5"
      />

      {editing ? (
        <div className="flex-1">
          <Input value={editText} onChange={(e) => setEditText(e.target.value)} className="text-sm mb-2" />
          <div className="flex space-x-2">
            <Button type="button" size="sm" variant="outline" onClick={handleSaveEdit} className="h-7 px-2 text-xs">
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={handleCancelEdit} className="h-7 px-2 text-xs">
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 justify-between">
          <label
            htmlFor={`milestone-${milestone.id}`}
            className={`text-sm ${milestone.completed ? "line-through text-gray-400" : "text-gray-700"}`}
          >
            {milestone.title}
          </label>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-3.5 w-3.5 text-gray-500" />
          </Button>
        </div>
      )}
    </div>
  )
}

