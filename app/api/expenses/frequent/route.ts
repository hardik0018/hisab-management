import { auth } from "@/auth";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb-promise";

/**
 * GET /api/expenses/frequent
 * Returns the 6 most frequently logged {itemName, amount, category} pairs
 * for the current user's space, used as "repeat chips" in QuickAddBar.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Get user's space_id first
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });
    if (!user?.space_id) {
      return NextResponse.json({ items: [] });
    }

    const items = await db
      .collection("expenses")
      .aggregate([
        {
          $match: {
            space_id: user.space_id,
            type: { $in: ["expense", null] },
            associatedType: { $nin: ["hisab", "marriage"] },
            itemName: { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: { itemName: "$itemName", amount: "$amount" },
            count: { $sum: 1 },
            category: { $last: "$category" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 6 },
        {
          $project: {
            _id: 0,
            itemName: "$_id.itemName",
            amount: "$_id.amount",
            category: 1,
            count: 1,
          },
        },
      ])
      .toArray();

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[FREQUENT_EXPENSES_ERROR]", err);
    return NextResponse.json({ items: [] });
  }
}
