import { db } from "@/db";
import { emailConnections, receipts, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

const sampleConfirmations = [
  {
    key: "little-owl-coffee",
    merchant: "Little Owl Coffee",
    amount: "16.72",
    category: "Dining",
    note: "Purchase confirmation from your sample inbox",
    fileName: "little-owl-purchase-confirmation.txt",
    daysAgo: 0,
  },
  {
    key: "paper-plane-books",
    merchant: "Paper Plane Books",
    amount: "28.65",
    category: "Shopping",
    note: "Order confirmation from your sample inbox",
    fileName: "paper-plane-order-confirmation.txt",
    daysAgo: 1,
  },
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const connectionId = typeof body.connectionId === "string" ? body.connectionId : "";
    if (!/^[0-9a-f-]{36}$/i.test(connectionId)) {
      return Response.json({ error: "Choose an inbox connection to sync." }, { status: 400 });
    }

    const [connection] = await db
      .select()
      .from(emailConnections)
      .where(eq(emailConnections.id, connectionId))
      .limit(1);
    if (!connection) return Response.json({ error: "Inbox connection not found." }, { status: 404 });
    if (!connection.previewMode) {
      return Response.json({ error: "This connection cannot be synced in preview mode." }, { status: 400 });
    }

    let imported = 0;
    for (const confirmation of sampleConfirmations) {
      const purchasedAt = new Date(Date.now() - confirmation.daysAgo * 24 * 60 * 60 * 1000);
      const [purchase] = await db
        .insert(transactions)
        .values({
          merchant: confirmation.merchant,
          note: confirmation.note,
          amount: confirmation.amount,
          category: confirmation.category,
          purchasedAt,
          paymentMethod: "Inbox purchase confirmation",
          source: "email",
          sourceReference: `preview:${connection.id}:${confirmation.key}`,
        })
        .onConflictDoNothing()
        .returning({ id: transactions.id });

      if (!purchase) continue;
      await db.insert(receipts).values({
        transactionId: purchase.id,
        fileName: confirmation.fileName,
        mimeType: "text/plain",
        fileData: [
          "MORROW · SAMPLE PURCHASE CONFIRMATION",
          "",
          `From: ${connection.provider} sample inbox`,
          `Merchant: ${confirmation.merchant}`,
          `Total paid: $${confirmation.amount}`,
          `Captured for: ${connection.email}`,
          "",
          "This is a simulated confirmation. No email was accessed.",
        ].join("\n"),
      });
      imported += 1;
    }

    const lastSyncedAt = new Date();
    await db.update(emailConnections).set({ lastSyncedAt }).where(eq(emailConnections.id, connection.id));

    return Response.json({ imported, checked: sampleConfirmations.length, lastSyncedAt: lastSyncedAt.toISOString() });
  } catch (error) {
    console.error("Could not sync preview inbox:", error);
    return Response.json({ error: "Could not sync this inbox." }, { status: 500 });
  }
}
