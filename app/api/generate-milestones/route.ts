import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { goal, purpose } = await req.json()

    if (!goal || typeof goal !== "string") {
      return Response.json({ error: "Goal is required" }, { status: 400 })
    }

    const prompt = `Goal: ${goal}${purpose ? `\nPurpose: ${purpose}` : ""}`

    const result = await generateText({
      model: anthropic("claude-3-7-sonnet-20250219"),
      maxTokens: 2000,
      temperature: 0.7,
      system:
        'You are a milestone generator for the Tiny Giant productivity app. Your task is to break down a user\'s goal into 4-5 specific, actionable key outcomes or milestones that will lead to the successful completion of the goal.\n\nFor each milestone:\n1. Make it specific and measurable\n2. Focus on outcomes rather than activities\n3. Ensure it represents meaningful progress\n4. Keep it concise (10 words or less)\n\nRespond ONLY with a JSON array of milestone strings. Do not include any explanations, introductions, or additional text. Example response format: ["Complete market research survey", "Draft initial proposal", "Get stakeholder feedback", "Finalize documentation"]',
      prompt,
    })

    // Try to parse the response as JSON
    try {
      // The response might have extra text, so try to extract just the JSON array
      const jsonMatch = result.text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const milestones = JSON.parse(jsonMatch[0])
        return Response.json({ milestones })
      } else {
        // If we can't find a JSON array, try to split the text into lines
        const lines = result.text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0 && !line.startsWith("[") && !line.startsWith("]"))

        return Response.json({ milestones: lines })
      }
    } catch (error) {
      console.error("Error parsing milestones:", error)
      // Fallback: split by newlines or numbers
      const fallbackMilestones = result.text
        .split(/\n|(?:\d+\.\s*)/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith("[") && !line.startsWith("]"))

      return Response.json({ milestones: fallbackMilestones.slice(0, 5) })
    }
  } catch (error) {
    console.error("Error generating milestones:", error)
    return Response.json({ error: "Failed to generate milestones. Please try again." }, { status: 500 })
  }
}

