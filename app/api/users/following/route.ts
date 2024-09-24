import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { rows } = await sql`
      SELECT followed_id
      FROM follows
      WHERE follower_id = ${userId}
    `;

    const followedUsers = rows.map((row) => row.followed_id);

    return NextResponse.json({ followedUsers });
  } catch (error) {
    console.error("Error fetching followed users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
