import { anthropic } from "@ai-sdk/anthropic"
import { streamText } from "ai"

export const maxDuration = 30 // Allow streaming responses up to 30 seconds

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    messages,
    temperature: 1,
    maxTokens: 2000,
    system:
      'You are Tiny Giant\'s Goal Assistant. Your task is to make minor clarifications to user goals with two specific improvements:\n\n1. Fix any grammar, spelling, or punctuation errors\n2. Add specificity ONLY when the goal lacks a clear metric or timeframe\n\nKeep the original wording and length as much as possible. Don\'t change the core intent.\n\nExamples:\nUser: "loose weight by summer"\nResponse: "Lose 10 kgs by summer"\n\nUser: "read more books"\nResponse: "Read 12 books this year"\n\nUser: "finish my project proposal"\nResponse: "Finish my project proposal by Friday"',
  })

  return result.toDataStreamResponse()
}

