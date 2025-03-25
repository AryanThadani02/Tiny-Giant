import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { goalId, text, timeEstimate, notes } = await request.json()

    // Validate required fields
    if (!goalId || text === undefined) {
      return NextResponse.json({ error: "Goal ID and text are required" }, { status: 400 })
    }

    // Try with admin client first
    let result = await supabaseAdmin
      .from("steps")
      .insert({
        goal_id: goalId,
        text,
        time_estimate: timeEstimate || 30,
        notes: notes || null,
      })
      .select()

    // If that fails, try with regular client
    if (result.error) {
      console.error("Error creating step with admin client:", result.error)

      // Try with regular client as fallback
      result = await supabase
        .from("steps")
        .insert({
          goal_id: goalId,
          text,
          time_estimate: timeEstimate || 30,
          notes: notes || null,
        })
        .select()

      if (result.error) {
        console.error("Error creating step with fallback:", result.error)

        // As a last resort, try to execute the stored procedure
        try {
          const sqlResult = await supabase.rpc("insert_step", {
            p_goal_id: goalId,
            p_text: text,
            p_time_estimate: timeEstimate || 30,
            p_notes: notes || null,
          })

          if (sqlResult.error) {
            throw new Error(sqlResult.error.message)
          }

          // If successful, fetch the newly created step
          const { data: newStep, error: fetchError } = await supabase
            .from("steps")
            .select()
            .eq("goal_id", goalId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          if (fetchError) {
            throw new Error(fetchError.message)
          }

          return NextResponse.json({ step: newStep })
        } catch (sqlError: any) {
          console.error("Error with SQL fallback:", sqlError)
          return NextResponse.json(
            {
              error: `Failed to create step. Please run the SQL setup script in Supabase.`,
            },
            { status: 500 },
          )
        }
      }
    }

    return NextResponse.json({ step: result.data?.[0] })
  } catch (error: any) {
    console.error("Error in POST /api/steps:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 400 })
  }
}

