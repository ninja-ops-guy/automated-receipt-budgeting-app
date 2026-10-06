import { db } from "@/db";
import { emailConnections } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function serializeConnection(connection: typeof emailConnections.$inferSelect) {
  return {
    id: connection.id,
    provider: connection.provider,
    email: connection.email,
    status: connection.status,
    previewMode: connection.previewMode,
    connectedAt: connection.connectedAt.toISOString(),
    lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
  };
}

export async function GET() {
  try {
    const rows = await db.select().from(emailConnections).orderBy(desc(emailConnections.connectedAt));
    return Response.json(rows.map(serializeConnection));
  } catch (error) {
    console.error("Could not list inbox connections:", error);
    return Response.json({ error: "Could not load inbox connections." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const provider = body.provider === "Outlook" ? "Outlook" : body.provider === "Gmail" ? "Gmail" : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!provider) return Response.json({ error: "Choose Gmail or Outlook." }, { status: 400 });
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const [connection] = await db
      .insert(emailConnections)
      .values({ provider, email, status: "connected", previewMode: true })
      .onConflictDoUpdate({
        target: emailConnections.email,
        set: { provider, status: "connected", previewMode: true },
      })
      .returning();

    return Response.json({ connection: serializeConnection(connection) }, { status: 201 });
  } catch (error) {
    console.error("Could not add inbox connection:", error);
    return Response.json({ error: "Could not add this inbox." }, { status: 500 });
  }
}
