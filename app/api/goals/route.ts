import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Try with admin client first
    const { data, error } = await supabaseAdmin
      .from("goals")
      .select(`
        *,
        steps(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching goals with admin client:", error)

      // Fallback to regular client
      const fallbackResult = await supabase
        .from("goals")
        .select(`
          *,
          steps(*)
        `)
        .order("created_at", { ascending: false })

      if (fallbackResult.error) {
        console.error("Error fetching goals with fallback:", fallbackResult.error)
        return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
      }

      return NextResponse.json({ goals: fallbackResult.data || [] })
    }

    return NextResponse.json({ goals: data || [] })
  } catch (error: any) {
    console.error("Error in GET /api/goals:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { title, purpose, dueDate, estimatedScore } = await request.json()

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Create the base goal object without the estimated_score field
    const goalData: any = {
      title,
      purpose,
      due_date: dueDate || null,
    }

    // Only add estimated_score if it exists and is a number
    if (estimatedScore !== undefined && !isNaN(Number(estimatedScore))) {
      try {
        // Try inserting with estimated_score
        const { data, error } = await supabaseAdmin
          .from("goals")
          .insert({
            ...goalData,
            estimated_score: estimatedScore,
          })
          .select()

        if (error) {
          // If there's an error with estimated_score, try without it
          console.error("Error creating goal with estimated_score:", error)
          throw new Error("Column not found")
        }

        return NextResponse.json({ goal: data[0] })
      } catch (err) {
        console.log("Falling back to insert without estimated_score")
        // Fall back to inserting without estimated_score
        const { data, error } = await supabaseAdmin.from("goals").insert(goalData).select()

        if (error) {
          console.error("Error creating goal without estimated_score:", error)
          return NextResponse.json({ error: `Failed to create goal: ${error.message}` }, { status: 500 })
        }

        return NextResponse.json({ goal: data[0] })
      }
    } else {
      // Insert without estimated_score
      const { data, error } = await supabaseAdmin.from("goals").insert(goalData).select()

      if (error) {
        console.error("Error creating goal:", error)
        return NextResponse.json({ error: `Failed to create goal: ${error.message}` }, { status: 500 })
      }

      return NextResponse.json({ goal: data[0] })
    }
  } catch (error: any) {
    console.error("Error in POST /api/goals:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 400 })
  }
}

