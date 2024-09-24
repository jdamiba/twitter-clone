import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  const followedUserId = params.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (userId === followedUserId) {
    return NextResponse.json(
      { error: "Cannot follow yourself" },
      { status: 400 }
    );
  }

  try {
    // Check if the followed user exists
    const { rows: followedUser } = await sql`
      SELECT id FROM users WHERE id = ${followedUserId}
    `;

    if (followedUser.length === 0) {
      return NextResponse.json(
        { error: "User to follow does not exist" },
        { status: 404 }
      );
    }

    // Check if the current user exists
    const { rows: currentUser } = await sql`
      SELECT id FROM users WHERE id = ${userId}
    `;

    if (currentUser.length === 0) {
      return NextResponse.json(
        { error: "Current user does not exist" },
        { status: 404 }
      );
    }

    // Check if already following
    const { rows: existingFollow } = await sql`
      SELECT * FROM follows
      WHERE follower_id = ${userId} AND followed_id = ${followedUserId}
    `;

    if (existingFollow.length > 0) {
      // Unfollow
      await sql`
        DELETE FROM follows
        WHERE follower_id = ${userId} AND followed_id = ${followedUserId}
      `;
      return NextResponse.json({ success: true, action: "unfollowed" });
    } else {
      // Follow
      await sql`
        INSERT INTO follows (follower_id, followed_id, created_at)
        VALUES (${userId}, ${followedUserId}, NOW())
      `;
      return NextResponse.json({ success: true, action: "followed" });
    }
  } catch (error) {
    console.error("Error following/unfollowing user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
