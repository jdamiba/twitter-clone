import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

function log(message: string, data?: unknown) {
  console.log(
    `[${new Date().toISOString()}] ${message}`,
    data ? JSON.stringify(data) : ""
  );
}

export async function GET() {
  log("GET request received");
  const { userId } = auth();
  log("User ID from auth:", userId);

  if (!userId) {
    log("Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    log("Fetching tasks for user:", userId);
    const result = await sql`
      SELECT * FROM tasks 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `;
    log("Tasks fetched successfully", { count: result.rowCount });
    return NextResponse.json({ tasks: result.rows }, { status: 200 });
  } catch (error) {
    log("Error fetching tasks", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  log("POST request received");
  const { userId } = auth();
  log("User ID from auth:", userId);

  if (!userId) {
    log("Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text, priority } = await request.json();
    log("Creating new task", { text, priority });
    const result = await sql`
      INSERT INTO tasks (user_id, text, priority)
      VALUES (${userId}, ${text}, ${priority})
      RETURNING *
    `;
    log("Task created successfully", result.rows[0]);
    return NextResponse.json({ task: result.rows[0] }, { status: 201 });
  } catch (error) {
    log("Error creating task", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  log("PUT request received");
  const { userId } = auth();
  log("User ID from auth:", userId);

  if (!userId) {
    log("Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, text, completed, priority } = await request.json();
    log("Updating task", { id, text, completed, priority });
    const result = await sql`
      UPDATE tasks
      SET text = ${text}, completed = ${completed}, priority = ${priority}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;
    if (result.rowCount === 0) {
      log("Task not found or unauthorized", { id, userId });
      return NextResponse.json(
        { error: "Task not found or unauthorized" },
        { status: 404 }
      );
    }
    log("Task updated successfully", result.rows[0]);
    return NextResponse.json({ task: result.rows[0] }, { status: 200 });
  } catch (error) {
    log("Error updating task", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  log("DELETE request received");
  const { userId } = auth();
  log("User ID from auth:", userId);

  if (!userId) {
    log("Unauthorized access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    log("Deleting task", { id });
    const result = await sql`
      DELETE FROM tasks 
      WHERE id = ${id} AND user_id = ${userId}
    `;
    if (result.rowCount === 0) {
      log("Task not found or unauthorized", { id, userId });
      return NextResponse.json(
        { error: "Task not found or unauthorized" },
        { status: 404 }
      );
    }
    log("Task deleted successfully", { id });
    return NextResponse.json(
      { message: "Task deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    log("Error deleting task", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
