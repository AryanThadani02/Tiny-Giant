import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { goal, milestone, purpose, steps, dueDate } = await req.json()

    if (!goal || typeof goal !== "string") {
      return Response.json({ error: "Goal is required" }, { status: 400 })
    }

    // Format the steps for the prompt with step numbers
    const completedSteps = steps.filter((s: any) => s.completed)
    const incompleteSteps = steps.filter((s: any) => !s.completed)

    // Calculate the next step number
    const nextStepNumber = steps.length + 1

    // Build the prompt with all available context and explicit step numbers
    let prompt = `Goal: ${goal}`

    if (milestone) {
      prompt += `\nMilestone: ${milestone}`
    }

    if (purpose) {
      prompt += `\nPurpose: ${purpose}`
    }

    if (dueDate) {
      prompt += `\nDue Date: ${dueDate}`
    }

    if (completedSteps.length > 0) {
      prompt += `\n\nCompleted Steps:`
      completedSteps.forEach((step: any, index: number) => {
        const stepNumber = steps.findIndex((s: any) => s.id === step.id) + 1
        prompt += `\nStep ${stepNumber}: ${step.text}`
      })
    }

    if (incompleteSteps.length > 0) {
      prompt += `\n\nIn Progress Steps:`
      incompleteSteps.forEach((step: any, index: number) => {
        const stepNumber = steps.findIndex((s: any) => s.id === step.id) + 1
        prompt += `\nStep ${stepNumber}: ${step.text}`
      })
    }

    prompt += `\n\nWhat should be Step ${nextStepNumber} for this milestone? This step must be different from all previous steps and move the milestone forward. Also estimate how many minutes this step will take (maximum 120 minutes).

Respond in this format:
Step ${nextStepNumber}: [step description]
Time: [estimated minutes]`

    const result = await generateText({
      model: anthropic("claude-3-7-sonnet-20250219"),
      maxTokens: 2000,
      temperature: 0.7,
      system:
        "You are a step-by-step goal achievement assistant. Your task is to suggest the next logical step that follows from the previous steps and moves toward the milestone and goal.\n" +
        "Rules for generating the next step:\n" +
        "1. It must be extremely specific and concrete\n" +
        "2. It should take no more than 2 hours to complete\n" +
        "3. It must be the smallest possible action that moves the milestone forward\n" +
        "4. It must logically follow from any completed steps\n" +
        "5. It must be immediately actionable\n" +
        "6. Keep the step description concise (under 15 words)\n" +
        "7. Focus on one single action\n" +
        "8. Include a realistic time estimate in minutes (max 120)\n" +
        "9. IMPORTANT: Never repeat previous steps - each step must be unique and new\n" +
        "10. IMPORTANT: Look at all previous steps to ensure you don't suggest something already done\n" +
        "11. Use vivid, specific language that creates a clear mental image\n" +
        "12. Be creative and interesting - avoid generic steps\n" +
        "\n" +
        "Respond in this format:\n" +
        "Step [number]: [step description]\n" +
        "Time: [estimated minutes]",
      prompt,
    })

    // Parse the response to extract step and time estimate
    const response = result.text.trim()
    const stepMatch = response.match(/Step \d+: (.+)/)
    const timeMatch = response.match(/Time: (\d+)/)

    if (!stepMatch || !timeMatch) {
      throw new Error("Invalid response format")
    }

    const nextStep = stepMatch[1].trim()
    const timeEstimate = Number.parseInt(timeMatch[1])

    return Response.json({
      nextStep,
      timeEstimate: Math.min(timeEstimate, 120), // Ensure max 120 minutes
    })
  } catch (error) {
    console.error("Error generating next step:", error)
    return Response.json({ error: "Failed to generate next step. Please try again." }, { status: 500 })
  }
}

