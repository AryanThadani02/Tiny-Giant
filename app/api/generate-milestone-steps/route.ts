import { anthropic } from "@ai-sdk/anthropic"
import { generateText } from "ai"

export async function POST(req: Request) {
  try {
    const { goalTitle, milestoneTitle, purpose, dueDate } = await req.json()

    if (!goalTitle || !milestoneTitle) {
      return Response.json({ error: "Goal title and milestone title are required" }, { status: 400 })
    }

    // Build the prompt with all available context
    let prompt = `Goal: ${goalTitle}
Milestone: ${milestoneTitle}`

    if (purpose) {
      prompt += `
Purpose: ${purpose}`
    }

    if (dueDate) {
      prompt += `
Due Date: ${dueDate}`
    }

    prompt += `

Break down this milestone into 3-5 specific, actionable steps that will lead to completing this milestone. Each step should be clear, concrete, and achievable in a single sitting.`

    const result = await generateText({
      model: anthropic("claude-3-7-sonnet-20250219"),
      maxTokens: 2000,
      temperature: 0.7,
      system:
        "You are a step generator for the Tiny Giant productivity app. Your task is to break down a milestone into 3-5 specific, actionable steps that will lead to the successful completion of the milestone.\n\n" +
        "For each step:\n" +
        "1. Make it specific and actionable - start with a verb\n" +
        "2. Keep it small and achievable (less than 2 hours of work)\n" +
        "3. Make it concrete enough that the user will know exactly when it's done\n" +
        "4. Include a realistic time estimate in minutes (between 15-120 minutes)\n" +
        "5. Make steps sequential and logical\n" +
        "6. Be creative and interesting - avoid generic steps\n" +
        "7. Use vivid, specific language that creates a clear mental image\n\n" +
        "Respond with a JSON array of step objects with 'text' and 'timeEstimate' properties. Example:\n" +
        '[{"text": "Create a mood board with 10 inspiring examples from competitors", "timeEstimate": 45}, {"text": "Sketch 3 homepage wireframes with different navigation styles", "timeEstimate": 60}]',
      prompt,
    })

    // Try to parse the response as JSON
    try {
      // The response might have extra text, so try to extract just the JSON array
      const jsonMatch = result.text.match(/\[[\s\S]*\]/)
      let data
      if (jsonMatch) {
        data = { steps: JSON.parse(jsonMatch[0]) }
      } else {
        // If we can't find a JSON array, try to parse the text into steps
        const lines = result.text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)

        // Try to extract steps and time estimates
        const parsedSteps = lines.map((line) => {
          // Try to extract time estimate if it exists
          const timeMatch = line.match(/(\d+)\s*min(ute)?s?/)
          let timeEstimate = 30 // Default time estimate
          let text = line

          if (timeMatch) {
            timeEstimate = Number.parseInt(timeMatch[1])
            // Remove the time estimate from the text
            text = line.replace(/$$\d+\s*min(ute)?s?$$/, "").trim()
          }

          // Remove any numbering at the beginning
          text = text.replace(/^\d+\.\s*/, "")

          return { text, timeEstimate }
        })

        data = { steps: parsedSteps }
      }

      // Update the response handling to ensure we're returning properly formatted steps
      if (data.steps && data.steps.length > 0) {
        // Ensure each step has the required properties
        const formattedSteps = data.steps.map((stepData: any) => {
          return {
            text: stepData.text || "New step",
            timeEstimate: Number.parseInt(stepData.timeEstimate) || 30,
          }
        })

        return Response.json({ steps: formattedSteps })
      } else {
        // If no steps were returned, create some default steps
        const defaultSteps = [
          { text: `Research best practices for ${milestoneTitle}`, timeEstimate: 45 },
          { text: `Create a detailed action plan for ${milestoneTitle}`, timeEstimate: 30 },
          { text: `Complete the first key task for ${milestoneTitle}`, timeEstimate: 60 },
        ]

        return Response.json({ steps: defaultSteps })
      }
    } catch (error) {
      console.error("Error parsing steps:", error)

      // Fallback: create some interesting steps
      const fallbackSteps = [
        { text: `Research best practices for ${milestoneTitle}`, timeEstimate: 45 },
        { text: `Create a detailed action plan for ${milestoneTitle}`, timeEstimate: 30 },
        { text: `Complete the first key task for ${milestoneTitle}`, timeEstimate: 60 },
      ]

      return Response.json({ steps: fallbackSteps })
    }
  } catch (error) {
    console.error("Error generating steps:", error)
    return Response.json({ error: "Failed to generate steps. Please try again." }, { status: 500 })
  }
}

