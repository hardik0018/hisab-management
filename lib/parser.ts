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
  "gave", "given", "diya", "didha", "lent", "de diya", "paid to", "paid",
  "debit", "debited", "dr", "udhar", "udhhar", "lend",
];

const GOT_WORDS = [
  "got", "took", "received", "liya", "lidha", "returned", "repaid", "mila",
  "credit", "credited", "cr", "jama", "borrowed", "borrow",
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

function cleanPersonName(name: string): string {
  const trimmed = name.trim().replace(/^[-:=,]+|[-:=,]+$/g, "").trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

// ── Hisab line parser ─────────────────────────────────────────────────────────

function parseHisabLine(raw: string, mode?: "expense" | "hisab"): ParsedHisabDraft | null {
  let text = raw.trim();
  if (!text) return null;

  const hasHisabPrefix = /^(?:hisab|udhar|jama)\s*[:=-]?\s+/i.test(text);
  if (hasHisabPrefix) {
    text = text.replace(/^(?:hisab|udhar|jama)\s*[:=-]?\s+/i, "").trim();
  }

  const isHisabContext = hasHisabPrefix || mode === "hisab";

  // Build regexes for verbs
  const verbAlternation = ALL_HISAB_WORDS.join("|");

  // Pattern 1: <verb> <Amount> <Name> [note] (e.g., "debit 500 Ramesh", "dr 500 Ramesh", "gave 500 Ramesh lunch")
  const p1 = new RegExp(
    `^(?<verb>${verbAlternation})\\s+${CURRENCY_RE}\\s*(?<amount>${NUM_RE})\\s+(?<name>[^\\d₹]+?)(?:\\s+(?<note>.*))?$`,
    "i"
  );
  let m = text.match(p1);
  if (m?.groups) {
    const verb = m.groups["verb"].toLowerCase();
    const amount = toNumber(m.groups["amount"] ?? "");
    const name = cleanPersonName(m.groups["name"] ?? "");
    const note = cleanNote(m.groups["note"] ?? "");
    if (name.length >= 1 && Number.isFinite(amount) && amount > 0) {
      return {
        kind: "hisab",
        personName: name,
        amount,
        type: GAVE_WORDS.includes(verb) ? "debit" : "credit",
        description: note,
        source: raw,
      };
    }
  }

  // Pattern 2: <verb> <Name> <Amount> [note] (e.g., "debit Ramesh 500", "gave Ramesh 500 lunch", "dr Ramesh 500")
  const p2 = new RegExp(
    `^(?<verb>${verbAlternation})\\s+(?<name>[^\\d₹]+?)\\s+${CURRENCY_RE}\\s*(?<amount>${NUM_RE})(?:\\s+(?<note>.*))?$`,
    "i"
  );
  m = text.match(p2);
  if (m?.groups) {
    const verb = m.groups["verb"].toLowerCase();
    const name = cleanPersonName(m.groups["name"] ?? "");
    const amount = toNumber(m.groups["amount"] ?? "");
    const note = cleanNote(m.groups["note"] ?? "");
    if (name.length >= 1 && Number.isFinite(amount) && amount > 0) {
      return {
        kind: "hisab",
        personName: name,
        amount,
        type: GAVE_WORDS.includes(verb) ? "debit" : "credit",
        description: note,
        source: raw,
      };
    }
  }

  // Pattern 3: <Name> <verb> <Amount> [note] (e.g., "Ramesh gave 500", "Ramesh debit 500", "Ramesh dr 500")
  const p3 = new RegExp(
    `^(?<name>[^\\d₹]+?)\\s+(?<verb>${verbAlternation})\\s+${CURRENCY_RE}\\s*(?<amount>${NUM_RE})(?:\\s+(?<note>.*))?$`,
    "i"
  );
  m = text.match(p3);
  if (m?.groups) {
    const verb = m.groups["verb"].toLowerCase();
    const name = cleanPersonName(m.groups["name"] ?? "");
    const amount = toNumber(m.groups["amount"] ?? "");
    const note = cleanNote(m.groups["note"] ?? "");
    if (name.length >= 1 && Number.isFinite(amount) && amount > 0) {
      return {
        kind: "hisab",
        personName: name,
        amount,
        type: GAVE_WORDS.includes(verb) ? "debit" : "credit",
        description: note,
        source: raw,
      };
    }
  }

  // Pattern 4: <Name> <Amount> <verb> [note] (e.g., "Ramesh 500 debit", "Ramesh 500 dr", "Ramesh 500 credit")
  const p4 = new RegExp(
    `^(?<name>[^\\d₹]+?)\\s+${CURRENCY_RE}\\s*(?<amount>${NUM_RE})\\s+(?<verb>${verbAlternation})(?:\\s+(?<note>.*))?$`,
    "i"
  );
  m = text.match(p4);
  if (m?.groups) {
    const verb = m.groups["verb"].toLowerCase();
    const name = cleanPersonName(m.groups["name"] ?? "");
    const amount = toNumber(m.groups["amount"] ?? "");
    const note = cleanNote(m.groups["note"] ?? "");
    if (name.length >= 1 && Number.isFinite(amount) && amount > 0) {
      return {
        kind: "hisab",
        personName: name,
        amount,
        type: GAVE_WORDS.includes(verb) ? "debit" : "credit",
        description: note,
        source: raw,
      };
    }
  }

  // Pattern 5: <Amount> <verb> <Name> [note] (e.g., "500 debit Ramesh", "500 credit Ramesh")
  const p5 = new RegExp(
    `^${CURRENCY_RE}\\s*(?<amount>${NUM_RE})\\s+(?<verb>${verbAlternation})\\s+(?<name>[^\\d₹]+?)(?:\\s+(?<note>.*))?$`,
    "i"
  );
  m = text.match(p5);
  if (m?.groups) {
    const verb = m.groups["verb"].toLowerCase();
    const amount = toNumber(m.groups["amount"] ?? "");
    const name = cleanPersonName(m.groups["name"] ?? "");
    const note = cleanNote(m.groups["note"] ?? "");
    if (name.length >= 1 && Number.isFinite(amount) && amount > 0) {
      return {
        kind: "hisab",
        personName: name,
        amount,
        type: GAVE_WORDS.includes(verb) ? "debit" : "credit",
        description: note,
        source: raw,
      };
    }
  }

  // Pattern 6: <Amount> <Name> <verb> [note] (e.g., "500 Ramesh debit")
  const p6 = new RegExp(
    `^${CURRENCY_RE}\\s*(?<amount>${NUM_RE})\\s+(?<name>[^\\d₹]+?)\\s+(?<verb>${verbAlternation})(?:\\s+(?<note>.*))?$`,
    "i"
  );
  m = text.match(p6);
  if (m?.groups) {
    const verb = m.groups["verb"].toLowerCase();
    const amount = toNumber(m.groups["amount"] ?? "");
    const name = cleanPersonName(m.groups["name"] ?? "");
    const note = cleanNote(m.groups["note"] ?? "");
    if (name.length >= 1 && Number.isFinite(amount) && amount > 0) {
      return {
        kind: "hisab",
        personName: name,
        amount,
        type: GAVE_WORDS.includes(verb) ? "debit" : "credit",
        description: note,
        source: raw,
      };
    }
  }

  // Pattern 7 (Contextual Hisab Mode / Prefix): <Name> <Amount> or <Amount> <Name> without explicit verb
  if (isHisabContext) {
    const itemFirst = text.match(ITEM_FIRST_RE);
    if (itemFirst?.groups) {
      const name = cleanPersonName(itemFirst.groups["item"] ?? "");
      const amount = toNumber(itemFirst.groups["amount"] ?? "");
      const note = cleanNote(itemFirst.groups["note"] ?? "");
      if (name.length >= 1 && Number.isFinite(amount) && amount > 0) {
        return {
          kind: "hisab",
          personName: name,
          amount,
          type: "debit", // Default in hisab context is debit (giving money)
          description: note,
          source: raw,
        };
      }
    }

    const amountFirst = text.match(AMOUNT_FIRST_RE);
    if (amountFirst?.groups) {
      const amount = toNumber(amountFirst.groups["amount"] ?? "");
      const name = cleanPersonName(amountFirst.groups["item"] ?? "");
      if (name.length >= 1 && Number.isFinite(amount) && amount > 0) {
        return {
          kind: "hisab",
          personName: name,
          amount,
          type: "debit",
          description: "",
          source: raw,
        };
      }
    }
  }

  return null;
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
  largeLimit = 10000,
  mode?: "expense" | "hisab"
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
    const hisab = parseHisabLine(chunk, mode);
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
