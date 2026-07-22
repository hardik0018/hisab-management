const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LOWER = "abcdefghijkmnopqrstuvwxyz";
const DIGIT = "23456789";
const SYMBOL = "!@#$%^&*()-_=+[]{}";

export interface GenOpts {
  length?: number;
  upper?: boolean;
  lower?: boolean;
  digits?: boolean;
  symbols?: boolean;
}

export function generatePassword(opts: GenOpts = {}): string {
  const { length = 16, upper = true, lower = true, digits = true, symbols = true } = opts;
  const pool =
    (upper ? UPPER : "") + (lower ? LOWER : "") + (digits ? DIGIT : "") + (symbols ? SYMBOL : "");
  if (!pool) return "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (v) => pool[v % pool.length]).join("");
}

export type Strength = "weak" | "fair" | "good" | "strong";

export function scorePassword(pw: string): { score: number; label: Strength; entropy: number } {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26;
  if (/[A-Z]/.test(pw)) pool += 26;
  if (/[0-9]/.test(pw)) pool += 10;
  if (/[^A-Za-z0-9]/.test(pw)) pool += 32;
  const entropy = pw.length * Math.log2(Math.max(pool, 1));
  const label: Strength =
    entropy < 40 ? "weak" : entropy < 60 ? "fair" : entropy < 80 ? "good" : "strong";
  const score = Math.min(100, Math.round((entropy / 100) * 100));
  return { score, label, entropy };
}
