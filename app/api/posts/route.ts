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
      WHERE p.user_id IN (
        SELECT followed_id FROM follows WHERE follower_id = ${userId}
      ) OR p.user_id = ${userId}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const { rows: totalCountResult } = await sql`
      SELECT COUNT(*) as total_count
      FROM posts p
      WHERE p.user_id IN (
        SELECT followed_id FROM follows WHERE follower_id = ${userId}
      ) OR p.user_id = ${userId}
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

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content, reply_to_id } = await request.json();
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO posts (content, user_id, reply_to_id)
      VALUES (${content}, ${userId}, ${reply_to_id || null})
      RETURNING id, content, created_at, updated_at, user_id, reply_to_id
    `;

    const post = result.rows[0];

    // Fetch user information
    const userResult = await sql`
      SELECT username, display_name FROM users WHERE id = ${userId}
    `;
    const user = userResult.rows[0];

    return NextResponse.json({
      post: {
        ...post,
        username: user.username,
        display_name: user.display_name,
        isLiked: false,
        likes_count: 0,
      },
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
