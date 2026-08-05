import { getDb } from "@/lib/db";
import { ObjectId } from "mongodb";
import type { PasswordEntry } from "@/types/passwordVault";

export async function passwordsCol() {
  const db = await getDb();
  const col = db.collection<PasswordEntry>("password_entries");
  return col;
}

export const toObjectId = (id: string) => new ObjectId(id);
