/**
 * lib/parser.ts
 * Forgiving one-line expense + hisab parser.
 *
 * Accepted shapes (examples):
 *   chai 20          item-first, no separator
 *   chai-20          item-first, dash separator
 *   chai ₹20         item-first, currency prefix
 *   20 chai          amount-first
 *   petrol 500 bike  item + amount + trailing note
 *   chai 20, petrol 500, grocery 1200   comma-separated batch
 *   Ramesh gave 500 lunch  hisab debit
 *   Ramesh took 500        hisab credit
 *   salary 45000           income (auto-detected)
 */

import { categorizeExpense } from "./category-engine";

// ── Public types ──────────────────────────────────────────────────────────────

export interface ParsedExpenseDraft {
  kind: "expense";
  itemName: string;
  amount: number;
  note: string;
  category: string;
  type: "expense" | "income";
  isLarge: boolean;
  source: string;
}

export interface ParsedHisabDraft {
  kind: "hisab";
  personName: string;
  amount: number;
  /** debit = we gave money (they owe us); credit = we took money (we owe them) */
  type: "credit" | "debit";
  description: string;
  source: string;
}

export interface ParsedTransferDraft {
  kind: "transfer";
  recipientName: string;
  amount: number;
  source: string;
}

export type ParsedDraft = ParsedExpenseDraft | ParsedHisabDraft | ParsedTransferDraft;

export interface InvalidLine {
  source: string;
  reason: string;
}

export interface ParseResult {
  items: ParsedDraft[];
  invalid: InvalidLine[];
  hasLarge: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INCOME_WORDS = [
  "salary", "income", "received", "credited", "bonus",
  "refund", "interest", "mila", "aayo", "aavi",
];

const GAVE_WORDS = [
  "gave", "given", "diya", "lent", "de diya", "paid to",
];

const GOT_WORDS = [
  "got", "took", "received", "liya", "returned", "repaid", "mila",
];

// All hisab keywords combined for quick detection
const ALL_HISAB_WORDS = [...GAVE_WORDS, ...GOT_WORDS];

// ── Regex helpers ─────────────────────────────────────────────────────────────

const CURRENCY_RE = String.raw`(?:₹|rs\.?|inr\s*)?`;
const NUM_RE = String.raw`\d+(?:[.,]\d+)?`;

/**
 * "chai 20", "chai-20", "chai ₹20", "petrol 500 bike"
 * Named groups: item, amount, note
 */
const ITEM_FIRST_RE = new RegExp(
  `^(?<item>[^\\d₹]+?)\\s*(?:[-:=]\\s*)?${CURRENCY_RE}\\s*(?<amount>${NUM_RE})\\s*(?<note>.*)$`,
  "i"
);

/**
 * "20 chai", "₹500 petrol"
 * Named groups: amount, item (rest)
 */
const AMOUNT_FIRST_RE = new RegExp(
  `^${CURRENCY_RE}\\s*(?<amount>${NUM_RE})\\s*(?:[-:=]\\s*)?(?<item>[^\\d].*)$`,
  "i"
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNumber(raw: string): number {
  return parseFloat(raw.replace(/,/g, ""));
}

function cleanNote(note: string): string {
  const t = note.trim();
  return t.startsWith("(") && t.endsWith(")") ? t.slice(1, -1).trim() : t;
}

// ── Hisab line parser ─────────────────────────────────────────────────────────

function parseHisabLine(raw: string): ParsedHisabDraft | null {
  const text = raw.trim();
  const lower = text.toLowerCase();

  // Find the first hisab verb that appears with a space before it
  let foundVerb: string | null = null;
  let verbIndex = -1;

  for (const verb of ALL_HISAB_WORDS) {
    // Match word as a whole token (preceded/followed by space or start/end)
    const idx = lower.indexOf(` ${verb} `);
    if (idx !== -1) {
      if (verbIndex === -1 || idx < verbIndex) {
        foundVerb = verb;
        verbIndex = idx;
      }
    }
    // Also try verb at end of string
    if (lower.endsWith(` ${verb}`)) {
      const idx2 = lower.length - verb.length - 1;
      if (verbIndex === -1 || idx2 < verbIndex) {
        foundVerb = verb;
        verbIndex = idx2;
      }
    }
  }

  if (!foundVerb || verbIndex === -1) return null;

  const personName = text.slice(0, verbIndex).trim();
  const rest = text.slice(verbIndex + foundVerb.length + 1).trim();

  if (!personName || personName.length < 1) return null;

  // Parse amount from the rest
  const HISAB_AMOUNT_RE = new RegExp(
    `^${CURRENCY_RE}\\s*(?<amount>${NUM_RE})\\s*(?<note>.*)$`,
    "i"
  );
  const m = rest.match(HISAB_AMOUNT_RE);
  if (!m?.groups) return null;

  const amount = toNumber(m.groups["amount"] ?? "");
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const isGave = GAVE_WORDS.includes(foundVerb);

  return {
    kind: "hisab",
    personName: personName.charAt(0).toUpperCase() + personName.slice(1),
    amount,
    type: isGave ? "debit" : "credit",
    description: cleanNote(m.groups["note"] ?? ""),
    source: raw,
  };
}

// ── Transfer line parser ──────────────────────────────────────────────────────

function parseTransferLine(raw: string): ParsedTransferDraft | null {
  const text = raw.trim();
  
  // Match "transfer 500 to Ramesh" or "transfer to Ramesh 500"
  // Words: transfer, send, sent
  const TRANSFER_RE_1 = /^(?:transfer|send|sent)\s+to\s+(?<recipient>[a-zA-Z\s]+?)\s+(?:(?:₹|rs\.?|inr\s*)?)(?<amount>\d+(?:[.,]\d+)?)$/i;
  const TRANSFER_RE_2 = /^(?:transfer|send|sent)\s+(?:(?:₹|rs\.?|inr\s*)?)(?<amount>\d+(?:[.,]\d+)?)\s+to\s+(?<recipient>[a-zA-Z\s]+)$/i;
  
  const m = text.match(TRANSFER_RE_1) ?? text.match(TRANSFER_RE_2);
  if (!m?.groups) return null;
  
  const amount = toNumber(m.groups["amount"] ?? "");
  if (!Number.isFinite(amount) || amount <= 0) return null;
  
  const recipientName = m.groups["recipient"].trim();
  if (recipientName.length < 2) return null;
  
  return {
    kind: "transfer",
    recipientName: recipientName.charAt(0).toUpperCase() + recipientName.slice(1),
    amount,
    source: raw
  };
}

// ── Expense line parser ───────────────────────────────────────────────────────

function parseExpenseLine(
  raw: string,
  largeLimit: number
): ParsedExpenseDraft | null {
  // Strip leading "exp " or "expense " prefix if present
  const text = raw.trim().replace(/^(?:exp|expense)\s+/i, "");

  const m = text.match(ITEM_FIRST_RE) ?? text.match(AMOUNT_FIRST_RE);
  if (!m?.groups) return null;

  const itemName = (m.groups["item"] ?? "")
    .trim()
    .replace(/[-:=,]+$/, "")
    .trim();
  const amount = toNumber(m.groups["amount"] ?? "");
  const note = cleanNote(m.groups["note"] ?? "");

  if (itemName.length < 2) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const combined = `${itemName} ${note}`.toLowerCase();
  const type: "expense" | "income" = INCOME_WORDS.some((w) =>
    combined.includes(w)
  )
    ? "income"
    : "expense";

  const category = categorizeExpense(itemName, note, amount, type);

  return {
    kind: "expense",
    itemName: itemName.charAt(0).toUpperCase() + itemName.slice(1),
    amount,
    note,
    category,
    type,
    isLarge: amount >= largeLimit,
    source: raw,
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Parse a string that may contain multiple entries separated by newlines
 * or commas/semicolons.
 *
 * Each chunk is first tested as a hisab line ("Ramesh gave 500"),
 * then as an expense line ("chai 20"). Unparsed chunks are returned
 * in `invalid` with a helpful reason — they never block the valid ones.
 *
 * @param text      Raw input string
 * @param largeLimit  Amount threshold for `isLarge` flag (default 10 000)
 */
export function parseEntries(
  text: string,
  largeLimit = 10000
): ParseResult {
  const items: ParsedDraft[] = [];
  const invalid: InvalidLine[] = [];
  let hasLarge = false;

  // Split on newlines, commas, or semicolons
  const chunks = text
    .split(/\r?\n|[,;]/)
    .map((c) => c.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    // Try hisab first (person-verb-amount pattern)
    const hisab = parseHisabLine(chunk);
    if (hisab) {
      if (hisab.amount >= largeLimit) hasLarge = true;
      items.push(hisab);
      continue;
    }

    // Try internal transfer
    const transfer = parseTransferLine(chunk);
    if (transfer) {
      if (transfer.amount >= largeLimit) hasLarge = true;
      items.push(transfer);
      continue;
    }

    // Try expense
    const expense = parseExpenseLine(chunk, largeLimit);
    if (expense) {
      if (expense.isLarge) hasLarge = true;
      items.push(expense);
      continue;
    }

    // Neither parsed
    const hasDigit = /\d/.test(chunk);
    invalid.push({
      source: chunk,
      reason: hasDigit
        ? "Add a name before or after the amount (e.g. chai 20)"
        : "Add an amount (e.g. chai 20)",
    });
  }

  return { items, invalid, hasLarge };
}

/**
 * Alias that matches the detectCategory name used in the prompt spec.
 * The real implementation lives in category-engine.ts as categorizeExpense.
 */
export const detectCategory = categorizeExpense;
