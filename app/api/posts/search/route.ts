import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET(request: NextRequest) {
  const searchQuery = request.nextUrl.searchParams.get("q");

  if (!searchQuery) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  try {
    const { rows } = await sql`
      SELECT p.*, u.username, u.display_name,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.content ILIKE ${`%${searchQuery}%`}
      ORDER BY p.created_at DESC
      LIMIT 50
    `;

    return NextResponse.json({ posts: rows });
  } catch (error) {
    console.error("Error searching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
