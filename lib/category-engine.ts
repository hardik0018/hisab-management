export const EXPENSE_CATEGORIES = [
  'Groceries & Kitchen',
  'Vegetables & Fruits',
  'Fuel, Vehicle & Travel',
  'Snacks, Food & Dining',
  'Bills, Rent & Housing',
  'Investments & Insurance',
  'Salary & Income',
  'Personal Care & Medical',
  'Shopping & Stores',
  'Education & Stationery',
  'Gifts & Marriage',
  'Transfers & Settlements',
  'General & Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

/**
 * Dynamically evaluates item name, note, amount, and transaction type against customized
 * regex patterns to automatically assign the most accurate expense category.
 *
 * @param itemName The title/item name of the expense.
 * @param note Optional note or description accompanying the expense.
 * @param amount Optional numerical amount of the transaction.
 * @param type Optional transaction type ('expense', 'income', 'transfer_in', 'transfer_out', etc.).
 * @param currentCategory Optional existing category. If already a valid specific category, it is preserved.
 * @returns The assigned category string.
 */
export function categorizeExpense(
  itemName: string,
  note?: string,
  amount?: number,
  type?: string,
  currentCategory?: string
): string {
  // If a specific, meaningful category is already assigned, preserve it
  if (
    currentCategory &&
    currentCategory.trim() !== '' &&
    currentCategory !== 'Uncategorized' &&
    currentCategory !== 'other' &&
    currentCategory !== 'General & Other'
  ) {
    return currentCategory.trim();
  }

  // Handle explicit transaction types first
  if (type === 'transfer_in' || type === 'transfer_out' || type === 'transfer') {
    return 'Transfers & Settlements';
  }

  const text = `${itemName} ${note || ''}`.toLowerCase().trim();

  // 1. Investments, Insurance & Savings (રોકાણ અને વીમો)
  if (/sip|lic|insurance|premium|policy|invest|mutual\s*fund|share|stock|gold|nifty/i.test(text)) {
    return 'Investments & Insurance';
  }

  // 2. Salary & Income (આવક અને પગાર)
  if (/salary|bonus|stipend|income|wage|synergy|prime|trion|overtime|over\s*time/i.test(text) || type === 'income') {
    return 'Salary & Income';
  }

  // 3. Fuel, Vehicle & Travel (વાહન અને મુસાફરી)
  if (/petrol|diesel|fuel|bike|servic|motorcycle|car|train|tren|bus|ticket|repido|rapido|echo|auto|taxi|travel|dada\(traveling\)|conductor|cab|uber|ola|flight/i.test(text)) {
    return 'Fuel, Vehicle & Travel';
  }

  // 4. Bills, Rent & Housing (બિલ, ભાડું અને ઘર)
  if (/recharge|mobile|wifi|broadband|light\s*bill|electricity|gas\s*bill|gas|bhadu|rent|room|makan|home|house|repair|blender|regulalater|regulator|fevicik|lock|chipiya|makoda|pest|chowk|plastic|khapad|kapda|katko|duster|cleaning|atm|charge|tax|gst/i.test(text)) {
    return 'Bills, Rent & Housing';
  }

  // 5. Vegetables & Fruits (શાકભાજી અને ફળ)
  if (/tameta|tamato|tomato|bateka|bataka|potato|rigna|ringna|rigana|rigan|brinjal|marcha|march|mirchi|karela|bhindo|kakdi|kakani|gavar|dudhi|kobi|cabbage|vatana|keri|kera|banana|mango|kachi\s*keri|sherdi|khalela|fulavar|fulavr|bakalu/i.test(text)) {
    return 'Vegetables & Fruits';
  }

  // 6. Groceries & Kitchen (કરિયાણું અને રસોડું)
  if (/dudh|milk|dhana|jisoda|jeeshoda|pawa|pava|samo|sabu|sabudani|sing|methi|sugar|khand|solt|salt|mithu|rava|kathor|mag|hing|mamra|mamara|astar|bakas|shree\s*fal|shreefal|nariyel|powder|khapda\s*dhovano|liquid|vasan|rooh|durvana|sori|chhash|chhaash|navratra|orsolum|oil|agarbatti|ghau|ઘઉં|kirana|kariyanu|grocery|masala|sev|chavanu|papad|lot|aato|flour|chana/i.test(text)) {
    return 'Groceries & Kitchen';
  }

  // 7. Snacks, Food & Dining (નાસ્તો અને જમવાનું)
  if (/nasto|snack|gathiya|bhungra|bungra|vefar|wafer|biscuit|puf|paf|gulfi|kulfi|panipuri|pani\s*puri|pavbhaji|pav\s*bhaji|megi|maggi|puri\s*shak|chocolate|\bcha\b|chai|tea|coffee|chips|hotel|restaurant|food|pizza|burger|chevdo|soda/i.test(text)) {
    return 'Snacks, Food & Dining';
  }

  // 8. Personal Care, Health & Medical (આરોગ્ય અને પર્સનલ કેર)
  if (/hair|cut|salon|doctor|hospital|medicine|medical|pharma|pill|clinic|test|blood|watch|whatch|colgate|sampoo|sempu|soap|ped|shampoo|dental|eye|jilaid|guard|shave|razor|blade|chasma|glasses|specs|spectacles|goggle|dava|dawa/i.test(text)) {
    return 'Personal Care & Medical';
  }

  // 9. Shopping & Stores (શોપિંગ અને ખરીદી)
  if (/dress|cloth|saree|saadi|shirt|pant|shoes|chappal|champal|mojadi|laptop|electronics|d\s*mart|dmart|shopping|bag|rotary|museum|mall|store|underwear|butti|butii/i.test(text)) {
    return 'Shopping & Stores';
  }

  // 10. Education & Stationery (શિક્ષણ અને સ્ટેશનરી)
  if (/msc|college|school|fee|tuition|exam|book|pen|xerox|stationery|print/i.test(text)) {
    return 'Education & Stationery';
  }

  // 11. Gifts, Marriage & Social (ભેટ, લગ્ન અને વ્યવહાર)
  if (/gift|vyahar|marriage|lagn|chandlo|shadi|dan|daan|bhet|rohit|friend|kotharo|papal/i.test(text)) {
    return 'Gifts & Marriage';
  }

  // 12. Transfers & Balance Settlements (ટ્રાન્સફર અને હિસાબ)
  if (/transfer|net\s*balance|balance|credit|debit|hisab|jama|udhar|settle|aayavar|pravinbhai|dhayrana|daurana|dado|demo|loan|borrow|lend|mahesh\s*kaka|nin/i.test(text)) {
    return 'Transfers & Settlements';
  }

  // Default fallback
  return 'General & Other';
}
