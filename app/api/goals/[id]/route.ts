import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Get goal with steps using the admin client
    const { data, error } = await supabaseAdmin
      .from("goals")
      .select(`
        *,
        steps(*)
      `)
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching goal:", error)
      return NextResponse.json({ error: "Failed to fetch goal" }, { status: 500 })
    }

    return NextResponse.json({ goal: data })
  } catch (error: any) {
    console.error("Error in GET /api/goals/[id]:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { title, purpose, dueDate } = await request.json()

    // Validate required fields
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Update goal using the admin client
    const { data, error } = await supabaseAdmin
      .from("goals")
      .update({
        title,
        purpose,
        due_date: dueDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      console.error("Error updating goal:", error)
      return NextResponse.json({ error: `Failed to update goal: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ goal: data[0] })
  } catch (error: any) {
    console.error("Error in PUT /api/goals/[id]:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Delete goal using the admin client
    const { error } = await supabaseAdmin.from("goals").delete().eq("id", id)

    if (error) {
      console.error("Error deleting goal:", error)
      return NextResponse.json({ error: `Failed to delete goal: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in DELETE /api/goals/[id]:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}

