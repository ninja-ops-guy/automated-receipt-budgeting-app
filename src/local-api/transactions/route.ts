import { db } from "@/db";
import { receipts, transactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: transactions.id,
        merchant: transactions.merchant,
        note: transactions.note,
        amount: transactions.amount,
        category: transactions.category,
        purchasedAt: transactions.purchasedAt,
        paymentMethod: transactions.paymentMethod,
        source: transactions.source,
        receiptId: receipts.id,
        receiptFileName: receipts.fileName,
        receiptMimeType: receipts.mimeType,
      })
      .from(transactions)
      .leftJoin(receipts, eq(receipts.transactionId, transactions.id))
      .orderBy(desc(transactions.purchasedAt))
      .limit(100);

    return Response.json(
      rows.map((purchase) => ({
        id: purchase.id,
        merchant: purchase.merchant,
        note: purchase.note,
        amount: Number(purchase.amount),
        category: purchase.category,
        purchasedAt: purchase.purchasedAt.toISOString(),
        paymentMethod: purchase.paymentMethod,
        source: purchase.source,
        receipt: purchase.receiptId
          ? {
              id: purchase.receiptId,
              fileName: purchase.receiptFileName ?? "Saved receipt",
              mimeType: purchase.receiptMimeType ?? "application/octet-stream",
            }
          : null,
      })),
    );
  } catch (error) {
    console.error("Could not list purchases:", error);
    return Response.json({ error: "Could not load purchases." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const merchant = typeof body.merchant === "string" ? body.merchant.trim() : "";
    const amount = Number(body.amount);
    const category = typeof body.category === "string" ? body.category.trim() : "Other";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.trim() : "";
    const purchasedAt = body.purchasedAt ? new Date(String(body.purchasedAt)) : new Date();

    if (!merchant || merchant.length > 120) {
      return Response.json({ error: "Enter a merchant name under 120 characters." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) {
      return Response.json({ error: "Enter a valid purchase amount." }, { status: 400 });
    }
    if (!category || category.length > 60) {
      return Response.json({ error: "Choose a valid spending category." }, { status: 400 });
    }
    if (Number.isNaN(purchasedAt.getTime())) {
      return Response.json({ error: "Enter a valid purchase date." }, { status: 400 });
    }

    const [purchase] = await db
      .insert(transactions)
      .values({
        merchant,
        note: note || null,
        amount: amount.toFixed(2),
        category,
        purchasedAt,
        paymentMethod: paymentMethod || null,
        source: "manual",
      })
      .returning();

    return Response.json(
      {
        transaction: {
          ...purchase,
          amount: Number(purchase.amount),
          purchasedAt: purchase.purchasedAt.toISOString(),
          receipt: null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Could not save purchase:", error);
    return Response.json({ error: "Could not save this purchase." }, { status: 500 });
  }
}
