import { db } from "@/db";
import { budgets } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(budgets).orderBy(asc(budgets.category));
    return Response.json(rows.map((budget) => ({ ...budget, monthlyLimit: Number(budget.monthlyLimit) })));
  } catch (error) {
    console.error("Could not list budgets:", error);
    return Response.json({ error: "Could not load budgets." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { budgets?: unknown };
    if (!Array.isArray(body.budgets) || body.budgets.length > 30) {
      return Response.json({ error: "Provide a valid list of category limits." }, { status: 400 });
    }

    const updates: { category: string; monthlyLimit: number }[] = [];
    for (const item of body.budgets) {
      if (!item || typeof item !== "object") {
        return Response.json({ error: "Each budget needs a category and monthly limit." }, { status: 400 });
      }
      const candidate = item as Record<string, unknown>;
      const category = typeof candidate.category === "string" ? candidate.category.trim() : "";
      const monthlyLimit = Number(candidate.monthlyLimit);
      if (!category || category.length > 60 || !Number.isFinite(monthlyLimit) || monthlyLimit < 1 || monthlyLimit > 1_000_000) {
        return Response.json({ error: "Monthly limits must be between $1 and $1,000,000." }, { status: 400 });
      }
      updates.push({ category, monthlyLimit });
    }

    for (const update of updates) {
      await db
        .insert(budgets)
        .values({ category: update.category, monthlyLimit: update.monthlyLimit.toFixed(2) })
        .onConflictDoUpdate({
          target: budgets.category,
          set: { monthlyLimit: update.monthlyLimit.toFixed(2), updatedAt: new Date() },
        });
    }

    const rows = await db.select().from(budgets).orderBy(asc(budgets.category));
    return Response.json({ budgets: rows.map((budget) => ({ ...budget, monthlyLimit: Number(budget.monthlyLimit) })) });
  } catch (error) {
    console.error("Could not update budgets:", error);
    return Response.json({ error: "Could not update your budgets." }, { status: 500 });
  }
}
