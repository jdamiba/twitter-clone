import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const postId = params.id;

  // Get the current user's session using Clerk
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Check if the post belongs to the current user
    const postOwner = await sql`
      SELECT user_id FROM posts WHERE id = ${postId}
    `;

    if (postOwner.rows[0].user_id === userId) {
      return NextResponse.json(
        { success: false, error: "You cannot like your own post" },
        { status: 400 }
      );
    }

    // Check if the user has already liked the post
    const existingLike = await sql`
      SELECT * FROM likes
      WHERE user_id = ${userId} AND post_id = ${postId}
    `;

    if (existingLike.rowCount && existingLike.rowCount > 0) {
      // If the like exists, remove it
      await sql`
        DELETE FROM likes
        WHERE user_id = ${userId} AND post_id = ${postId}
      `;
    } else {
      // If the like doesn't exist, add it
      await sql`
        INSERT INTO likes (user_id, post_id)
        VALUES (${userId}, ${postId})
      `;
    }

    // Get the updated like count
    const likeCount = await sql`
      SELECT COUNT(*) AS count FROM likes WHERE post_id = ${postId}
    `;

    return NextResponse.json({
      success: true,
      likes_count: parseInt(likeCount.rows[0].count),
      isLiked: existingLike.rowCount === 0, // true if we just added the like, false if we removed it
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
