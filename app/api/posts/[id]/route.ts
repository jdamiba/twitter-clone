import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  const id = params.id;

  try {
    // Fetch the main post
    const postResult = await sql`
      SELECT 
        p.id, p.content, p.created_at, p.updated_at, p.user_id,
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
      WHERE p.id = ${id}
    `;

    if (postResult.rowCount === 0) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = postResult.rows[0];

    // Fetch replies for the post
    const repliesResult = await sql`
      SELECT 
        p.id, p.content, p.created_at, p.updated_at, p.user_id,
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
      WHERE p.reply_to_id = ${id}
      ORDER BY p.created_at ASC
    `;

    post.replies = repliesResult.rows;

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  const postId = params.id;

  console.log(`PUT request received for post ${postId} by user ${userId}`);

  if (!userId) {
    console.log("Unauthorized: No user ID");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { content } = await request.json();
    console.log(`Received content: ${content}`);

    if (!content || content.length > 140) {
      console.log("Invalid content");
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    // Check if the post belongs to the user and get the original content
    const postResult = await sql`
      SELECT * FROM posts WHERE id = ${postId} AND user_id = ${userId}
    `;

    console.log(`Post query result: ${JSON.stringify(postResult.rows)}`);

    if (postResult.rows.length === 0) {
      console.log("Post not found or unauthorized");
      return NextResponse.json(
        { error: "Post not found or unauthorized" },
        { status: 404 }
      );
    }

    const originalContent = postResult.rows[0].content;

    // Update the post
    const result = await sql`
      UPDATE posts
      SET content = ${content}, updated_at = NOW(), original_content = ${originalContent}, is_edited = TRUE
      WHERE id = ${postId}
      RETURNING id, content, created_at, updated_at, user_id, original_content, is_edited
    `;

    console.log(`Update result: ${JSON.stringify(result.rows)}`);

    const post = result.rows[0];

    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  const postId = params.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if the post belongs to the user
    const postResult = await sql`
      SELECT * FROM posts WHERE id = ${postId} AND user_id = ${userId}
    `;

    if (postResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Post not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the post
    await sql`DELETE FROM posts WHERE id = ${postId}`;

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
