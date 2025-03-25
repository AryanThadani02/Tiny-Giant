import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { goal } = await req.json()

    if (!goal || typeof goal !== "string") {
      return Response.json({ error: "Goal is required" }, { status: 400 })
    }

    const result = await generateText({
      model: anthropic("claude-3-7-sonnet-20250219"),
      maxTokens: 2000,
      temperature: 1,
      system:
        'You are Tiny Giant\'s Goal Assistant. Your task is to make minor clarifications to user goals with two specific improvements:\n\n1. Fix any grammar, spelling, or punctuation errors\n2. Add specificity ONLY when the goal lacks a clear metric or timeframe\n\nKeep the original wording and length as much as possible. Don\'t change the core intent. Do not use quotation marks in your response.\n\nExamples:\nUser: "loose weight by summer"\nResponse: Lose 10 kgs by summer\n\nUser: "read more books"\nResponse: Read 12 books this year\n\nUser: "finish my project proposal"\nResponse: Finish my project proposal by Friday',
      prompt: goal,
    })

    // Remove any remaining double quotes from the response
    const cleanedResponse = result.text.replace(/"/g, "")

    return Response.json({ clarifiedGoal: cleanedResponse })
  } catch (error) {
    console.error("Error clarifying goal:", error)
    return Response.json({ error: "Failed to clarify goal. Please try again." }, { status: 500 })
  }
}

