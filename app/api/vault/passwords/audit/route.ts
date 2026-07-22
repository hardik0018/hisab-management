import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { passwordsCol } from "@/models/PasswordEntry";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const col = await passwordsCol();
  const rows = await col
    .find({ user_id: user.user_id }, { projection: { title: 1, username: 1, password_hash: 1, password_length: 1, updated_at: 1 } })
    .toArray();

  const byHash = new Map<string, typeof rows>();
  for (const r of rows) {
    const arr = byHash.get(r.password_hash) ?? [];
    arr.push(r);
    byHash.set(r.password_hash, arr);
  }
  const reused = [...byHash.values()].filter((g) => g.length > 1).flat();
  const weak = rows.filter((r) => r.password_length < 10);
  const stale = rows.filter((r) => {
    const d = new Date(r.updated_at).getTime();
    return Date.now() - d > 1000 * 60 * 60 * 24 * 365; // > 1 year
  });
  return NextResponse.json({ weak, reused, stale, total: rows.length });
}
