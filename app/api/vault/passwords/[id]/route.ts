import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { passwordsCol, toObjectId } from "@/models/PasswordEntry";
import { decryptPassword, encryptPassword, hashForAudit } from "@/lib/vaultCrypto";

async function loadOwned(id: string, userId: string, spaceId?: string | null) {
  const col = await passwordsCol();
  const row = await col.findOne({ _id: toObjectId(id) });
  if (!row) return null;
  const isOwner = row.user_id === userId && (row.space_id == null);
  const isSpaceMember = row.space_id && spaceId && row.space_id === spaceId;
  if (!isOwner && !isSpaceMember) return null;
  return row;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const spaceId = new URL(req.url).searchParams.get("space_id");
  const row = await loadOwned(id, user.user_id, spaceId);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // reveal ONLY on this endpoint; mark last_used_at
  const password = decryptPassword(row.password_ciphertext);
  const col = await passwordsCol();
  await col.updateOne({ _id: row._id }, { $set: { last_used_at: new Date() } });

  const { password_ciphertext, ...safe } = row as any;
  return NextResponse.json({ item: { ...safe, password } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const spaceId = body?.space_id ?? null;
  const row = await loadOwned(id, user.user_id, spaceId);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update: any = { updated_at: new Date() };
  for (const k of ["title", "username", "website", "category", "notes", "favorite", "space_id"]) {
    if (k in body) update[k] = body[k];
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    try {
      update.password_ciphertext = encryptPassword(body.password);
      update.password_hash = hashForAudit(body.password);
      update.password_length = body.password.length;
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }
  const col = await passwordsCol();
  await col.updateOne({ _id: row._id }, { $set: update });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const row = await loadOwned(id, user.user_id, null);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const col = await passwordsCol();
  await col.deleteOne({ _id: row._id });
  return NextResponse.json({ ok: true });
}
