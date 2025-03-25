import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { text, completed, timeEstimate, notes } = await request.json()

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (text !== undefined) updateData.text = text
    if (timeEstimate !== undefined) updateData.time_estimate = timeEstimate
    if (notes !== undefined) updateData.notes = notes

    // Handle completion status change
    if (completed !== undefined) {
      updateData.completed = completed
      updateData.completed_at = completed ? new Date().toISOString() : null
    }

    // Update step using the admin client
    const { data, error } = await supabaseAdmin.from("steps").update(updateData).eq("id", id).select()

    if (error) {
      console.error("Error updating step:", error)
      return NextResponse.json({ error: `Failed to update step: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ step: data[0] })
  } catch (error: any) {
    console.error("Error in PUT /api/steps/[id]:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 400 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Delete step using the admin client
    const { error } = await supabaseAdmin.from("steps").delete().eq("id", id)

    if (error) {
      console.error("Error deleting step:", error)
      return NextResponse.json({ error: `Failed to delete step: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error in DELETE /api/steps/[id]:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}

