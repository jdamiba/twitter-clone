import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  const { userId } = auth();
  const url = new URL(request.url);
  const userIdParam = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = sql`
      SELECT p.*, u.username, u.display_name,
             (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS likes_count,
             TRUE AS is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN likes l ON p.id = l.post_id
      WHERE l.user_id = ${userIdParam || userId}
      ORDER BY l.created_at DESC
      LIMIT 50
    `;

    const result = await query;
    const posts = result.rows.map((post) => ({
      ...post,
      isLiked: post.is_liked,
      likes_count: parseInt(post.likes_count),
    }));
    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch liked posts" },
      { status: 500 }
    );
  }
}
