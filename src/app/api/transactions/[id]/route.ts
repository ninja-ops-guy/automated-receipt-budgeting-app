import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "Purchase not found." }, { status: 404 });
  }

  try {
    const [deleted] = await db.delete(transactions).where(eq(transactions.id, id)).returning({ id: transactions.id });
    if (!deleted) return Response.json({ error: "Purchase not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Could not delete purchase:", error);
    return Response.json({ error: "Could not remove this purchase." }, { status: 500 });
  }
}
