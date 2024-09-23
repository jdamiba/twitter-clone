import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const POSTS_PER_PAGE = 10;

export async function GET(request: Request) {
  const { userId } = auth();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const offset = (page - 1) * POSTS_PER_PAGE;

  try {
    const result = await sql`
      WITH post_data AS (
        SELECT 
          p.id, p.content, p.created_at, p.updated_at, p.user_id, p.reply_to_id,
          u.username, u.display_name,
          COALESCE(l.like_count, 0) as likes_count,
          CASE WHEN ul.user_id IS NOT NULL THEN true ELSE false END as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN (
          SELECT post_id, COUNT(*) as like_count
          FROM likes
          GROUP BY post_id
        ) l ON p.id = l.post_id
        LEFT JOIN likes ul ON p.id = ul.post_id AND ul.user_id = ${userId}
        WHERE p.reply_to_id IS NULL
        ORDER BY p.created_at DESC
        LIMIT ${POSTS_PER_PAGE} OFFSET ${offset}
      )
      SELECT 
        pd.*,
        (SELECT json_agg(r) FROM (
          SELECT 
            r.id, r.content, r.created_at, r.updated_at, r.user_id,
            u.username, u.display_name,
            COALESCE(rl.like_count, 0) as likes_count,
            CASE WHEN rul.user_id IS NOT NULL THEN true ELSE false END as is_liked
          FROM posts r
          JOIN users u ON r.user_id = u.id
          LEFT JOIN (
            SELECT post_id, COUNT(*) as like_count
            FROM likes
            GROUP BY post_id
          ) rl ON r.id = rl.post_id
          LEFT JOIN likes rul ON r.id = rul.post_id AND rul.user_id = ${userId}
          WHERE r.reply_to_id = pd.id
          ORDER BY r.created_at ASC
        ) r) as replies
      FROM post_data pd
    `;

    const posts = result.rows;

    // Get total count of posts for pagination
    const countResult = await sql`
      SELECT COUNT(*) FROM posts WHERE reply_to_id IS NULL
    `;
    const totalPosts = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

    return NextResponse.json({ posts, totalPages, currentPage: page });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
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
