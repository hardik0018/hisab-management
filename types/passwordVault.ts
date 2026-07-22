import type { ObjectId } from "mongodb";

export type PasswordCategory = "Bank" | "Social" | "Work" | "Shopping" | "Email" | "Utility" | "Other";

export interface PasswordEntry {
  _id?: string | ObjectId;
  user_id: string;
  space_id?: string | null;      // null = strictly personal
  title: string;                  // e.g. "HDFC Netbanking"
  username: string;               // email / user id / card no
  website?: string;
  category: PasswordCategory;
  notes?: string;
  favorite?: boolean;

  // encrypted at rest, never sent to list endpoints
  password_ciphertext: string;    // base64: iv | tag | ct
  password_hash: string;          // sha256 hex, for reuse audit (never reversible)
  password_length: number;        // for strength meter without decrypting

  created_at: Date;
  updated_at: Date;
  last_used_at?: Date;
}

export interface PasswordEntryPublic extends Omit<PasswordEntry, "password_ciphertext"> {}
