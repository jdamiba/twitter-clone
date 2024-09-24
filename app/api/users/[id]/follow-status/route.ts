import { NextRequest, NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  const followedUserId = params.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await sql`
      SELECT * FROM follows
      WHERE follower_id = ${userId} AND followed_id = ${followedUserId}
    `;

    const isFollowing = rows.length > 0;

    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
