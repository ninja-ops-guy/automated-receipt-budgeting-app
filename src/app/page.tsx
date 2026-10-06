import { db } from "@/db";
import { budgets, emailConnections, receipts, transactions } from "@/db/schema";
import BudgetWorkspace, {
  type BudgetRecord,
  type EmailConnectionRecord,
  type PurchaseRecord,
} from "./budget-workspace";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const demoPurchases = [
  {
    id: "b0000000-0000-4000-8000-000000000001",
    merchant: "Olive & Oak Market",
    note: "A little restock for the week",
    amount: "186.40",
    category: "Groceries",
    daysAgo: 1,
    source: "email",
    paymentMethod: "Everyday debit ·· 4821",
    sourceReference: "demo:olive-oak-market",
  },
  {
    id: "b0000000-0000-4000-8000-000000000002",
    merchant: "Morning Chapter",
    note: "Coffee with a friend",
    amount: "18.75",
    category: "Dining",
    daysAgo: 2,
    source: "email",
    paymentMethod: "Everyday debit ·· 4821",
    sourceReference: "demo:morning-chapter",
  },
  {
    id: "b0000000-0000-4000-8000-000000000003",
    merchant: "Orbit Music",
    note: "Monthly membership",
    amount: "10.99",
    category: "Subscriptions",
    daysAgo: 3,
    source: "email",
    paymentMethod: "Everyday debit ·· 4821",
    sourceReference: "demo:orbit-music",
  },
  {
    id: "b0000000-0000-4000-8000-000000000004",
    merchant: "City Transit",
    note: "Monthly travel pass",
    amount: "86.00",
    category: "Transport",
    daysAgo: 4,
    source: "email",
    paymentMethod: "Everyday debit ·· 4821",
    sourceReference: "demo:city-transit",
  },
  {
    id: "b0000000-0000-4000-8000-000000000005",
    merchant: "Frame & Field",
    note: "A small upgrade for home",
    amount: "342.60",
    category: "Home",
    daysAgo: 6,
    source: "manual",
    paymentMethod: "Everyday debit ·· 4821",
    sourceReference: "demo:frame-and-field",
  },
  {
    id: "b0000000-0000-4000-8000-000000000006",
    merchant: "Northbound Outfitters",
    note: "Rain jacket, finally",
    amount: "189.50",
    category: "Shopping",
    daysAgo: 8,
    source: "email",
    paymentMethod: "Everyday debit ·· 4821",
    sourceReference: "demo:northbound-outfitters",
  },
  {
    id: "b0000000-0000-4000-8000-000000000007",
    merchant: "Kindred Pilates",
    note: "Class pack",
    amount: "109.00",
    category: "Health",
    daysAgo: 11,
    source: "email",
    paymentMethod: "Everyday debit ·· 4821",
    sourceReference: "demo:kindred-pilates",
  },
  {
    id: "b0000000-0000-4000-8000-000000000008",
    merchant: "Sunday Table",
    note: "Dinner out",
    amount: "82.50",
    category: "Dining",
    daysAgo: 14,
    source: "manual",
    paymentMethod: "Everyday debit ·· 4821",
    sourceReference: "demo:sunday-table",
  },
  {
    id: "b0000000-0000-4000-8000-000000000009",
    merchant: "Bookshop 44",
    note: "Two good reads",
    amount: "59.80",
    category: "Shopping",
    daysAgo: 18,
    source: "email",
    paymentMethod: "Everyday debit ·· 4821",
    sourceReference: "demo:bookshop-44",
  },
  {
    id: "b0000000-0000-4000-8000-000000000010",
    merchant: "Union Market",
    note: "Farmstand and pantry staples",
    amount: "142.20",
    category: "Groceries",
    daysAgo: 22,
    source: "email",
    paymentMethod: "Everyday debit ·· 4821",
    sourceReference: "demo:union-market",
  },
  {
    id: "b0000000-0000-4000-8000-000000000011",
    merchant: "Tidewater Internet",
    note: "Monthly internet bill",
    amount: "64.00",
    category: "Home",
    daysAgo: 34,
    source: "email",
    paymentMethod: "Everyday debit ·· 4821",
    sourceReference: "demo:tidewater-internet",
  },
];

const demoReceiptPurchases = [
  {
    transactionId: demoPurchases[0].id,
    fileName: "olive-oak-email-receipt.txt",
    merchant: demoPurchases[0].merchant,
    amount: demoPurchases[0].amount,
  },
  {
    transactionId: demoPurchases[2].id,
    fileName: "orbit-music-confirmation.txt",
    merchant: demoPurchases[2].merchant,
    amount: demoPurchases[2].amount,
  },
  {
    transactionId: demoPurchases[4].id,
    fileName: "frame-and-field-receipt.txt",
    merchant: demoPurchases[4].merchant,
    amount: demoPurchases[4].amount,
  },
  {
    transactionId: demoPurchases[5].id,
    fileName: "northbound-order-confirmation.txt",
    merchant: demoPurchases[5].merchant,
    amount: demoPurchases[5].amount,
  },
  {
    transactionId: demoPurchases[9].id,
    fileName: "union-market-email-receipt.txt",
    merchant: demoPurchases[9].merchant,
    amount: demoPurchases[9].amount,
  },
];

const defaultBudgets = [
  { category: "Groceries", monthlyLimit: "560.00" },
  { category: "Dining", monthlyLimit: "420.00" },
  { category: "Subscriptions", monthlyLimit: "140.00" },
  { category: "Transport", monthlyLimit: "220.00" },
  { category: "Home", monthlyLimit: "950.00" },
  { category: "Shopping", monthlyLimit: "420.00" },
  { category: "Health", monthlyLimit: "280.00" },
  { category: "Entertainment", monthlyLimit: "180.00" },
  { category: "Other", monthlyLimit: "250.00" },
];

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

async function ensureDemoWorkspace() {
  const existingTransactions = await db
    .select({ id: transactions.id })
    .from(transactions)
    .limit(1);

  if (existingTransactions.length === 0) {
    await db
      .insert(transactions)
      .values(
        demoPurchases.map(({ daysAgo, ...purchase }) => ({
          ...purchase,
          purchasedAt: dateDaysAgo(daysAgo),
        })),
      )
      .onConflictDoNothing();

    await db
      .insert(receipts)
      .values(
        demoReceiptPurchases.map((receipt) => ({
          transactionId: receipt.transactionId,
          fileName: receipt.fileName,
          mimeType: "text/plain",
          fileData: [
            "MORROW · SAMPLE PURCHASE CONFIRMATION",
            "",
            `Merchant: ${receipt.merchant}`,
            `Total paid: $${receipt.amount}`,
            "Payment: Everyday debit ·· 4821",
            "",
            "This sample receipt was saved in your Morrow receipt drawer.",
          ].join("\n"),
        })),
      )
      .onConflictDoNothing();
  }

  const existingBudgets = await db.select({ id: budgets.id }).from(budgets).limit(1);
  if (existingBudgets.length === 0) {
    await db.insert(budgets).values(defaultBudgets).onConflictDoNothing();
  }

  const existingConnections = await db
    .select({ id: emailConnections.id })
    .from(emailConnections)
    .limit(1);
  if (existingConnections.length === 0) {
    await db
      .insert(emailConnections)
      .values({
        id: "a0000000-0000-4000-8000-000000000001",
        provider: "Gmail",
        email: "preview@morrow.example",
        status: "connected",
        previewMode: true,
        lastSyncedAt: new Date(Date.now() - 1000 * 60 * 42),
      })
      .onConflictDoNothing();
  }
}

export default async function HomePage() {
  let initialTransactions: PurchaseRecord[] = [];
  let initialConnections: EmailConnectionRecord[] = [];
  let initialBudgets: BudgetRecord[] = [];

  try {
    await ensureDemoWorkspace();

    const [purchaseRows, connectionRows, budgetRows] = await Promise.all([
      db
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
        .limit(100),
      db.select().from(emailConnections).orderBy(desc(emailConnections.connectedAt)),
      db.select().from(budgets).orderBy(budgets.category),
    ]);

    initialTransactions = purchaseRows.map((purchase) => ({
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
    }));

    initialConnections = connectionRows.map((connection) => ({
      id: connection.id,
      provider: connection.provider,
      email: connection.email,
      status: connection.status,
      previewMode: connection.previewMode,
      connectedAt: connection.connectedAt.toISOString(),
      lastSyncedAt: connection.lastSyncedAt?.toISOString() ?? null,
    }));

    initialBudgets = budgetRows.map((budget) => ({
      id: budget.id,
      category: budget.category,
      monthlyLimit: Number(budget.monthlyLimit),
    }));
  } catch (error) {
    console.error("Morrow workspace could not load from PostgreSQL:", error);
  }

  return (
    <BudgetWorkspace
      initialTransactions={initialTransactions}
      initialConnections={initialConnections}
      initialBudgets={initialBudgets}
    />
  );
}
