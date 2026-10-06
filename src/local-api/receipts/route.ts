import { db } from "@/db";
import { receipts, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const transactionId = typeof body.transactionId === "string" ? body.transactionId : "";
    const fileName = typeof body.fileName === "string" ? body.fileName.trim().slice(0, 180) : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType.toLowerCase() : "";
    const fileData = typeof body.fileData === "string" ? body.fileData : "";

    if (!/^[0-9a-f-]{36}$/i.test(transactionId) || !fileName) {
      return Response.json({ error: "A purchase and receipt filename are required." }, { status: 400 });
    }
    if (!(mimeType.startsWith("image/") || mimeType === "application/pdf")) {
      return Response.json({ error: "Receipts must be an image or PDF file." }, { status: 400 });
    }
    if (!fileData.startsWith(`data:${mimeType};base64,`) || fileData.length > 7_100_000) {
      return Response.json({ error: "Choose a valid receipt smaller than 5 MB." }, { status: 400 });
    }

    const [purchase] = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(eq(transactions.id, transactionId))
      .limit(1);
    if (!purchase) return Response.json({ error: "The purchase for this receipt was not found." }, { status: 404 });

    const [receipt] = await db
      .insert(receipts)
      .values({ transactionId, fileName, mimeType, fileData })
      .onConflictDoUpdate({
        target: receipts.transactionId,
        set: { fileName, mimeType, fileData, createdAt: new Date() },
      })
      .returning({ id: receipts.id, fileName: receipts.fileName, mimeType: receipts.mimeType });

    return Response.json({ receipt }, { status: 201 });
  } catch (error) {
    console.error("Could not save receipt:", error);
    return Response.json({ error: "Could not save this receipt." }, { status: 500 });
  }
}
