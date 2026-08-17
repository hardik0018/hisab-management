import { parseExpenses } from './expense-parser';
import { parseTextDate } from './date-utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParsedHisab = {
  kind: 'hisab';
  name: string;
  type: 'debit' | 'credit'; // debit = gave (they owe you), credit = took (you owe them)
  amount: number;
  description: string;
  date: string;
  logAsExpense: boolean;
};

export type ParsedInsurance = {
  kind: 'insurance';
  policyName: string;
  provider: string;
  premiumAmount: number;
  premiumFrequency: 'yearly' | 'monthly' | 'quarterly' | 'half_yearly';
  nextDueDate: string;
  holderName: string;
  policyNumber: string;
  startDate: string;
  notes: string;
};

export type ParsedWarranty = {
  kind: 'warranty';
  itemName: string;
  brand: string;
  purchaseDate: string;
  warrantyMonths: number;
  expiryDate: string;
  notes: string;
};

export type ParsedPassword = {
  kind: 'password';
  title: string;
  username: string;
  password: string;
  website?: string;
  notes: string;
};

export type ParsedExpenseItem = {
  kind: 'expense';
  date: string;
  itemName: string;
  amount: number;
  note: string;
  isLarge?: boolean;
};

export type UniversalParsedItem =
  | ParsedHisab
  | ParsedInsurance
  | ParsedWarranty
  | ParsedPassword
  | ParsedExpenseItem;

export type UniversalInvalidLine = {
  line: string;
  reason: string;
};

export type UniversalParseResult = {
  items: UniversalParsedItem[];
  invalidLines: UniversalInvalidLine[];
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = (): string => new Date().toISOString().split('T')[0];

/** Normalise a YYYY-MM or YYYY-MM-DD string to YYYY-MM-DD. */
function normaliseDate(raw: string): string | null {
  const full = /^\d{4}-\d{2}-\d{2}$/.test(raw);
  const ym   = /^\d{4}-\d{2}$/.test(raw);
  if (full) return raw;
  if (ym)   return `${raw}-01`;
  return null;
}

const FREQ_MAP: Record<string, ParsedInsurance['premiumFrequency']> = {
  yearly: 'yearly', year: 'yearly', annual: 'yearly', annually: 'yearly',
  monthly: 'monthly', month: 'monthly',
  quarterly: 'quarterly', quarter: 'quarterly',
  half: 'half_yearly', 'half-yearly': 'half_yearly', halfyearly: 'half_yearly',
};

// ─── Per-module parsers ───────────────────────────────────────────────────────

/**
 * hisab <Name> gave|lent|debit|dr <Amount> [note...]
 * hisab debit|credit <Amount> <Name> [note...]
 * hisab <Name> took|borrowed|liya|credit|cr <Amount> [note...]
 * hisab <Name> <Amount> [note...]
 */
function parseHisabLine(parts: string[], date: string): ParsedHisab | UniversalInvalidLine {
  const raw = parts.join(' ').trim();
  if (!raw) {
    return { line: 'hisab', reason: 'Missing hisab details — e.g. hisab Ramesh debit 500' };
  }

  const gaveRe = /\b(gave|given|diya|didha|lent|paid\s+to|paid|debit|debited|dr|udhar|udhhar|lend)\b/i;
  const tookRe = /\b(took|borrowed|liya|lidha|received|mila|returned|repaid|credit|credited|cr|jama|borrow)\b/i;

  const gaveM = raw.match(gaveRe);
  const tookM = raw.match(tookRe);

  let direction: 'debit' | 'credit' = 'debit';
  let matchedVerb = '';
  let kwIndex = -1;

  if (gaveM?.index !== undefined && (tookM?.index === undefined || gaveM.index <= tookM.index)) {
    direction = 'debit';
    matchedVerb = gaveM[0];
    kwIndex = gaveM.index;
  } else if (tookM?.index !== undefined) {
    direction = 'credit';
    matchedVerb = tookM[0];
    kwIndex = tookM.index;
  }

  // 1. Verb is at start: e.g. "debit 500 Ramesh" or "debit Ramesh 500"
  if (kwIndex === 0) {
    const afterVerb = raw.slice(matchedVerb.length).trim();
    // Check if amount first: e.g. "500 Ramesh"
    const amtFirstM = afterVerb.match(/^(?:₹|rs\.?|inr\s*)?(\d+(?:[.,]\d+)?)\s+([^0-9₹]+?)(?:\s+(.*))?$/i);
    if (amtFirstM) {
      const amount = parseFloat(amtFirstM[1].replace(/,/g, ''));
      const name = amtFirstM[2].trim();
      const note = (amtFirstM[3] || '').trim();
      if (name && Number.isFinite(amount) && amount > 0) {
        return { kind: 'hisab', name, type: direction, amount, description: note, date, logAsExpense: true };
      }
    }
    // Check if name first: e.g. "Ramesh 500"
    const nameFirstM = afterVerb.match(/^([^0-9₹]+?)\s+(?:₹|rs\.?|inr\s*)?(\d+(?:[.,]\d+)?)(?:\s+(.*))?$/i);
    if (nameFirstM) {
      const name = nameFirstM[1].trim();
      const amount = parseFloat(nameFirstM[2].replace(/,/g, ''));
      const note = (nameFirstM[3] || '').trim();
      if (name && Number.isFinite(amount) && amount > 0) {
        return { kind: 'hisab', name, type: direction, amount, description: note, date, logAsExpense: true };
      }
    }
  }

  // 2. Verb is in middle: e.g. "Ramesh debit 500" or "Ramesh gave 500 lunch"
  if (kwIndex > 0) {
    const before = raw.slice(0, kwIndex).trim();
    const after = raw.slice(kwIndex + matchedVerb.length).trim();
    const [amtStr, ...noteParts] = after.split(/\s+/);
    const amount = parseFloat(amtStr.replace(/[^0-9.]/g, ''));
    if (before && Number.isFinite(amount) && amount > 0) {
      return {
        kind: 'hisab',
        name: before,
        type: direction,
        amount,
        description: noteParts.join(' '),
        date,
        logAsExpense: true,
      };
    }
  }

  // 3. No verb found or verb at end: fallback for "hisab Ramesh 500" or "hisab 500 Ramesh"
  const defaultItemFirst = raw.match(/^([^0-9₹]+?)\s+(?:₹|rs\.?|inr\s*)?(\d+(?:[.,]\d+)?)(?:\s+(.*))?$/i);
  if (defaultItemFirst) {
    const name = defaultItemFirst[1].trim();
    const amount = parseFloat(defaultItemFirst[2].replace(/,/g, ''));
    const note = (defaultItemFirst[3] || '').trim();
    if (name && Number.isFinite(amount) && amount > 0) {
      return { kind: 'hisab', name, type: direction, amount, description: note, date, logAsExpense: true };
    }
  }

  const defaultAmtFirst = raw.match(/^(?:₹|rs\.?|inr\s*)?(\d+(?:[.,]\d+)?)\s+([^0-9₹]+?)(?:\s+(.*))?$/i);
  if (defaultAmtFirst) {
    const amount = parseFloat(defaultAmtFirst[1].replace(/,/g, ''));
    const name = defaultAmtFirst[2].trim();
    const note = (defaultAmtFirst[3] || '').trim();
    if (name && Number.isFinite(amount) && amount > 0) {
      return { kind: 'hisab', name, type: direction, amount, description: note, date, logAsExpense: true };
    }
  }

  return { line: `hisab ${raw}`, reason: 'Use name and amount — e.g. hisab Ramesh debit 500' };
}

/**
 * ins <PolicyName> <Provider> <Premium> [yearly|monthly|quarterly|half] <YYYY-MM[-DD]> [notes...]
 * e.g. ins LIC Health 5000 yearly 2027-06
 */
function parseInsuranceLine(parts: string[], date: string): ParsedInsurance | UniversalInvalidLine {
  const raw = parts.join(' ').trim();
  const tokens = raw.split(/\s+/);

  // Find the premium amount token (first pure number)
  let premiumIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (/^\d+(\.\d+)?$/.test(tokens[i])) { premiumIdx = i; break; }
  }

  if (premiumIdx === -1) {
    return { line: `ins ${raw}`, reason: 'Missing premium amount — e.g. ins LIC Health 5000 yearly 2027-06' };
  }

  const nameParts = tokens.slice(0, premiumIdx);
  if (nameParts.length < 1) {
    return { line: `ins ${raw}`, reason: 'Missing policy name — e.g. ins LIC Health 5000 yearly 2027-06' };
  }

  const policyName = nameParts[0];
  const provider   = nameParts.length >= 2 ? nameParts.slice(1).join(' ') : nameParts[0];
  const premium    = parseFloat(tokens[premiumIdx]);

  // After premium: optional frequency, then date
  const rest = tokens.slice(premiumIdx + 1);
  let freq: ParsedInsurance['premiumFrequency'] = 'yearly';
  let dueDateRaw = '';
  let noteStart = 0;

  for (let i = 0; i < rest.length; i++) {
    const t = rest[i].toLowerCase();
    if (FREQ_MAP[t]) { freq = FREQ_MAP[t]; continue; }
    if (/^\d{4}-\d{2}(-\d{2})?$/.test(rest[i])) { dueDateRaw = rest[i]; noteStart = i + 1; break; }
    noteStart = i + 1;
  }

  const nextDueDate = dueDateRaw ? (normaliseDate(dueDateRaw) ?? '') : '';
  const today = TODAY();

  return {
    kind: 'insurance',
    policyName,
    provider,
    premiumAmount: premium,
    premiumFrequency: freq,
    nextDueDate: nextDueDate || today,
    holderName: 'Self',
    policyNumber: `QA-${Date.now()}`,
    startDate: today,
    notes: rest.slice(noteStart).join(' '),
  };
}

/**
 * war <ItemName> [Brand] <PurchaseDate YYYY-MM[-DD]> <ExpiryDate YYYY-MM[-DD]> [notes...]
 * e.g. war Samsung TV 2024-01 2027-01
 */
function parseWarrantyLine(parts: string[], date: string): ParsedWarranty | UniversalInvalidLine {
  const raw = parts.join(' ').trim();
  const tokens = raw.split(/\s+/);

  // Find the first date token
  const dateIndices: number[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (/^\d{4}-\d{2}(-\d{2})?$/.test(tokens[i])) dateIndices.push(i);
  }

  if (dateIndices.length < 1) {
    return { line: `war ${raw}`, reason: 'Need purchase date — e.g. war Samsung TV 2024-01 2027-01' };
  }

  const firstDateIdx = dateIndices[0];
  const nameParts = tokens.slice(0, firstDateIdx);
  if (nameParts.length < 1) {
    return { line: `war ${raw}`, reason: 'Missing item name — e.g. war Samsung TV 2024-01 2027-01' };
  }

  const itemName = nameParts[0];
  const brand    = nameParts.length >= 2 ? nameParts.slice(1).join(' ') : '';

  const purchaseDateRaw = tokens[firstDateIdx];
  const purchaseDate = normaliseDate(purchaseDateRaw) ?? TODAY();

  let expiryDate = '';
  let warrantyMonths = 12;
  let noteStart = firstDateIdx + 1;

  if (dateIndices.length >= 2) {
    const expiryRaw = tokens[dateIndices[1]];
    expiryDate = normaliseDate(expiryRaw) ?? '';
    noteStart = dateIndices[1] + 1;

    // Calculate warranty months from the two dates
    const p = new Date(purchaseDate);
    const e = new Date(expiryDate);
    warrantyMonths = Math.max(1, Math.round((e.getTime() - p.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  } else {
    // Default to 12 months
    const p = new Date(purchaseDate);
    p.setMonth(p.getMonth() + 12);
    expiryDate = p.toISOString().slice(0, 10);
  }

  return {
    kind: 'warranty',
    itemName,
    brand,
    purchaseDate,
    warrantyMonths,
    expiryDate,
    notes: tokens.slice(noteStart).join(' '),
  };
}

/**
 * pass <Title/Site> <Username> <Password> [notes...]
 * e.g. pass gmail.com hardik@gmail myP@ss123
 */
function parsePasswordLine(parts: string[]): ParsedPassword | UniversalInvalidLine {
  const [title, username, password, ...noteParts] = parts;

  if (!title) return { line: `pass ${parts.join(' ')}`, reason: 'Missing site/title — e.g. pass gmail.com user pass123' };
  if (!username) return { line: `pass ${parts.join(' ')}`, reason: 'Missing username — e.g. pass gmail.com user pass123' };
  if (!password) return { line: `pass ${parts.join(' ')}`, reason: 'Missing password — e.g. pass gmail.com user pass123' };

  const isUrl = /^https?:\/\//.test(title) || title.includes('.');

  return {
    kind: 'password',
    title,
    username,
    password,
    website: isUrl ? title : undefined,
    notes: noteParts.join(' '),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Parses a multiline string where each line can target a different module:
 *   - No prefix          → expense (uses existing expense parser)
 *   - hisab <...>        → hisab/udhar record
 *   - ins <...>          → insurance policy
 *   - war <...>          → warranty record
 *   - pass <...>         → password entry
 *   - Date lines         → changes active date for subsequent expense lines
 */
export function parseUniversal(
  text: string,
  datePickerDate: string,
  largeAmountLimit: number = 10000
): UniversalParseResult {
  const lines = text.split(/\r?\n/);
  const items: UniversalParsedItem[] = [];
  const invalidLines: UniversalInvalidLine[] = [];
  let activeDate = datePickerDate;

  // Collect non-prefixed lines for batch expense parsing
  const expenseLines: string[] = [];
  const expenseLineIndices: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    const spaceIdx = trimmed.indexOf(' ');
    const prefix = spaceIdx === -1 ? lower : lower.slice(0, spaceIdx);
    const rest = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1).trim();
    const restParts = rest.split(/\s+/);

    // Check for date line first (no prefix, parseable date)
    const parsedDate = parseTextDate(trimmed);
    if (parsedDate && !['hisab', 'ins', 'war', 'pass'].includes(prefix)) {
      activeDate = parsedDate;
      continue;
    }

    if (prefix === 'hisab') {
      const result = parseHisabLine(restParts, activeDate);
      if ('kind' in result) items.push(result);
      else invalidLines.push(result);
    } else if (prefix === 'ins') {
      const result = parseInsuranceLine(restParts, activeDate);
      if ('kind' in result) items.push(result);
      else invalidLines.push(result);
    } else if (prefix === 'war') {
      const result = parseWarrantyLine(restParts, activeDate);
      if ('kind' in result) items.push(result);
      else invalidLines.push(result);
    } else if (prefix === 'pass') {
      const result = parsePasswordLine(restParts);
      if ('kind' in result) items.push(result);
      else invalidLines.push(result);
    } else {
      // Treat as expense line — accumulate with current active date
      expenseLines.push(trimmed);
      expenseLineIndices.push(i);
    }
  }

  // Batch-parse all expense lines using existing parser
  if (expenseLines.length > 0) {
    const expText = expenseLines.join('\n');
    const expResult = parseExpenses(expText, activeDate, largeAmountLimit);
    for (const exp of expResult.validExpenses) {
      items.push({ kind: 'expense', ...exp });
    }
    for (const inv of expResult.invalidLines) {
      invalidLines.push({ line: inv.line, reason: inv.reason });
    }
  }

  return { items, invalidLines };
}
