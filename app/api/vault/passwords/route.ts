import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { passwordsCol } from "@/models/PasswordEntry";
import { encryptPassword, hashForAudit } from "@/lib/vaultCrypto";

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const category = url.searchParams.get("category");
  const spaceId = url.searchParams.get("space_id");

  const col = await passwordsCol();
  const filter: any = {
    $or: [
      { user_id: user.user_id, space_id: { $in: [null, undefined] } }, // personal
      ...(spaceId ? [{ space_id: spaceId }] : []),                // shared with active space
    ],
  };
  if (category) filter.category = category;
  if (q) {
    filter.$and = [
      { $or: [{ title: { $regex: q, $options: "i" } }, { username: { $regex: q, $options: "i" } }, { website: { $regex: q, $options: "i" } }] },
    ];
  }

  const rows = await col
    .find(filter, { projection: { password_ciphertext: 0 } }) // never leak ciphertext in lists
    .sort({ favorite: -1, updated_at: -1 })
    .limit(500)
    .toArray();

  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, username, password, website, category = "Other", notes, favorite, space_id } = body ?? {};
  if (!title || !username || !password) {
    return NextResponse.json({ error: "title, username, password required" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length > 512) {
    return NextResponse.json({ error: "invalid password" }, { status: 400 });
  }

  let ciphertext, hash;
  try {
    ciphertext = encryptPassword(password);
    hash = hashForAudit(password);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = new Date();
  const col = await passwordsCol();
  const doc = {
    user_id: user.user_id,
    space_id: space_id ?? null,
    title: String(title).slice(0, 120),
    username: String(username).slice(0, 200),
    website: website ? String(website).slice(0, 300) : undefined,
    category,
    notes: notes ? String(notes).slice(0, 2000) : undefined,
    favorite: !!favorite,
    password_ciphertext: ciphertext,
    password_hash: hash,
    password_length: password.length,
    created_at: now,
    updated_at: now,
  };
  try {
    const { insertedId } = await col.insertOne(doc as any);
    const { password_ciphertext, ...safe } = doc as any;
    return NextResponse.json({ item: { _id: insertedId, ...safe } }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
