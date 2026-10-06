import { db } from "@/db";
import { emailConnections } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "Inbox connection not found." }, { status: 404 });
  }

  try {
    const [removed] = await db
      .delete(emailConnections)
      .where(eq(emailConnections.id, id))
      .returning({ id: emailConnections.id });
    if (!removed) return Response.json({ error: "Inbox connection not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not remove inbox connection:", error);
    return Response.json({ error: "Could not remove this inbox." }, { status: 500 });
  }
}
