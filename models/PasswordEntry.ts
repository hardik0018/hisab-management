import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { PasswordEntry } from "@/types/passwordVault";

export async function passwordsCol() {
  const db = await getDb();
  const col = db.collection<PasswordEntry>("password_entries");
  await col.createIndex({ user_id: 1, updated_at: -1 });
  await col.createIndex({ space_id: 1 });
  await col.createIndex({ user_id: 1, password_hash: 1 }); // reuse audit
  return col;
}

export const toObjectId = (id: string) => new ObjectId(id);
