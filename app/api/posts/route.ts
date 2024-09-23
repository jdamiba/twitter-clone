import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { sql } from "@vercel/postgres";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const likedBy = searchParams.get("likedBy");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;
  const offset = (page - 1) * limit;

  try {
    let postsQuery, countQuery;
    const { userId: currentUserId } = auth();

    if (userId) {
      postsQuery = sql`
        SELECT p.*, u.username, u.display_name,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${currentUserId}) as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.user_id = ${userId}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`SELECT COUNT(*) FROM posts WHERE user_id = ${userId}`;
    } else if (likedBy) {
      postsQuery = sql`
        SELECT p.*, u.username, u.display_name,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${currentUserId}) as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN likes l ON p.id = l.post_id
        WHERE l.user_id = ${likedBy}
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`SELECT COUNT(*) FROM likes WHERE user_id = ${likedBy}`;
    } else {
      postsQuery = sql`
        SELECT p.*, u.username, u.display_name,
               (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
               EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${currentUserId}) as is_liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
      countQuery = sql`SELECT COUNT(*) FROM posts`;
    }

    const [postsResult, countResult] = await Promise.all([
      postsQuery,
      countQuery,
    ]);
    const posts = postsResult.rows;
    const totalPosts = parseInt(countResult.rows[0].count);

    const formattedPosts = posts.map((post) => ({
      ...post,
      isLiked: post.is_liked,
    }));

    return NextResponse.json({
      posts: formattedPosts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Error fetching posts" },
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
