import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  const { userId } = auth();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;
  const offset = (page - 1) * limit;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows: posts } = await sql`
      SELECT p.*, u.username, u.display_name,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${userId}) as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const { rows: totalCountResult } = await sql`
      SELECT COUNT(*) as total_count
      FROM posts
    `;

    const totalCount = totalCountResult[0].total_count;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      posts,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
