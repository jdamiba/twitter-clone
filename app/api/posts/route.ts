import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sql`
      SELECT p.*, u.username, u.display_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `;
    return NextResponse.json({ posts: result.rows }, { status: 200 });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content } = await request.json();

    if (!content || content.length > 140) {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO posts (user_id, content)
      VALUES (${userId}, ${content})
      RETURNING id, content, created_at
    `;

    return NextResponse.json({ post: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}
