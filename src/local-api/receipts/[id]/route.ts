import { db } from "@/db";
import { receipts } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ error: "Receipt not found." }, { status: 404 });
  }

  try {
    const [receipt] = await db
      .select({ fileName: receipts.fileName, mimeType: receipts.mimeType, fileData: receipts.fileData })
      .from(receipts)
      .where(eq(receipts.id, id))
      .limit(1);
    if (!receipt) return Response.json({ error: "Receipt not found." }, { status: 404 });
    return Response.json({ receipt });
  } catch (error) {
    console.error("Could not open receipt:", error);
    return Response.json({ error: "Could not open this receipt." }, { status: 500 });
  }
}
