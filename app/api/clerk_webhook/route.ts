import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { sql } from "@vercel/postgres";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local"
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle the user.created event
  if (evt.type === "user.created") {
    const {
      id,
      email_addresses,
      first_name,
      last_name,
      image_url,
      created_at,
    } = evt.data;
    const primaryEmail = email_addresses.find(
      (email) => email.id === evt.data.primary_email_address_id
    );

    console.log(evt.data);

    if (primaryEmail) {
      try {
        // Insert or update user in the database
        await sql`
          INSERT INTO users (id, email, first_name, last_name, image_url, created_at, subscription_tier)
          VALUES (${id}, ${primaryEmail.email_address}, ${
          first_name || null
        }, ${last_name || null}, ${image_url || null}, to_timestamp(${
          created_at / 1000
        }), 'free')
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            image_url = EXCLUDED.image_url,
            updated_at = CURRENT_TIMESTAMP;
        `;
        console.log(`User ${id} inserted or updated in the database`);

        // Update user's private metadata in Clerk
        await clerkClient.users.updateUser(id, {
          privateMetadata: {
            subscription_tier: "free",
          },
        });
        console.log(`User ${id} private metadata updated in Clerk`);
      } catch (error) {
        console.error("Error processing user creation:", error);
        return new Response("Error processing user creation", {
          status: 500,
        });
      }
    }
  }

  return new Response("Webhook processed successfully", { status: 200 });
}
