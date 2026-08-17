/**
 * lib/voice-normalizer.ts
 * Normalizes speech recognition output across English (India) and Gujarati.
 * Converts spoken number words (e.g. "five hundred", "પાંચસો") into numeric digits.
 */

// Spoken numbers dictionary (English & Gujarati)
const NUMBER_WORDS: Record<string, number> = {
  // English Units & Teens
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,

  // English Tens
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,

  // Gujarati Numbers (Spoken words & numerals)
  '૦': 0, '૧': 1, '૨': 2, '૩': 3, '૪': 4, '૫': 5, '૬': 6, '૭': 7, '૮': 8, '૯': 9,
  એક: 1,
  બે: 2,
  ત્રણ: 3,
  ચાર: 4,
  પાંચ: 5,
  છ: 6,
  સાત: 7,
  આઠ: 8,
  નવ: 9,
  દસ: 10,
  અગિયાર: 11,
  બાર: 12,
  તેર: 13,
  ચૌદ: 14,
  પંદર: 15,
  સોળ: 16,
  સત્તર: 17,
  અઢાર: 18,
  ઓગણીસ: 19,
  વીસ: 20,
  પચીસ: 25,
  ત્રીસ: 30,
  પાંત્રીસ: 35,
  ચાલીસ: 40,
  પિસ્તાલીસ: 45,
  પચાસ: 50,
  સાઠ: 60,
  સિત્તેર: 70,
  એંસી: 80,
  નેવું: 90,
  સો: 100,
  દોઢસો: 150,
  બસો: 200,
  અઢીસો: 250,
  ત્રણસો: 300,
  ચારસો: 400,
  પાંચસો: 500,
  છસો: 600,
  સાતસો: 700,
  આઠસો: 800,
  નવસો: 900,
  હજાર: 1000,
  લાખ: 100000,
};

// Multipliers (English & Gujarati)
const MULTIPLIERS: Record<string, number> = {
  hundred: 100,
  thousand: 1000,
  lakh: 100000,
  crore: 10000000,
  k: 1000,
  સો: 100,
  હજાર: 1000,
  લાખ: 100000,
};

/**
 * Replaces Gujarati native digits (૧૨૩) with standard ASCII digits (123).
 */
export function normalizeIndicDigits(text: string): string {
  const gujaratiMap: Record<string, string> = {
    '૦': '0', '૧': '1', '૨': '2', '૩': '3', '૪': '4', '૫': '5', '૬': '6', '૭': '7', '૮': '8', '૯': '9',
  };
  return text.replace(/[૦-૯]/g, (digit) => gujaratiMap[digit] || digit);
}

/**
 * Normalizes spoken number words inside a phrase into numeric digits.
 * e.g.:
 *   "petrol five hundred" -> "petrol 500"
 *   "doodh sixty" -> "doodh 60"
 *   "દૂધ પચાસ" -> "દૂધ 50"
 *   "શાકભાજી ૧૨૦" -> "શાકભાજી 120"
 *   "ramesh gave two thousand" -> "ramesh gave 2000"
 */
export function normalizeSpokenExpenseText(rawText: string): string {
  if (!rawText || !rawText.trim()) return '';

  let text = normalizeIndicDigits(rawText.trim());

  // Remove common speech filler words & trailing periods
  text = text
    .replace(/[।\.]/g, '') // remove full stops
    .replace(/\s+/g, ' ')
    .replace(/\b(rupees?|rupiya|rs\.?|inr|રૂપિયા)\b/gi, '')
    .trim();

  // Tokenize and scan for number words / multipliers
  const words = text.split(' ');
  const resultWords: string[] = [];

  let i = 0;
  while (i < words.length) {
    const word = words[i].toLowerCase();
    const nextWord = i + 1 < words.length ? words[i + 1].toLowerCase() : '';

    // Check compound expressions like "two hundred", "five thousand", "પાંચ સો", "બે હજાર"
    if (NUMBER_WORDS[word] !== undefined && MULTIPLIERS[nextWord] !== undefined) {
      const computed = NUMBER_WORDS[word] * MULTIPLIERS[nextWord];
      resultWords.push(String(computed));
      i += 2;
      continue;
    }

    // Check single number word (e.g. "પાંચસો" -> 500, "fifty" -> 50)
    if (NUMBER_WORDS[word] !== undefined) {
      resultWords.push(String(NUMBER_WORDS[word]));
      i++;
      continue;
    }

    // Check if word is already a number followed by multiplier (e.g. "5 hundred" -> 500, "2k" -> 2000)
    const numMatch = word.match(/^(\d+)(k|hazar|sau|hundred|thousand)?$/i);
    if (numMatch && numMatch[2]) {
      const base = parseInt(numMatch[1], 10);
      const mult = MULTIPLIERS[numMatch[2].toLowerCase()] || 1;
      resultWords.push(String(base * mult));
      i++;
      continue;
    }

    if (/^\d+$/.test(word) && MULTIPLIERS[nextWord] !== undefined) {
      const base = parseInt(word, 10);
      const mult = MULTIPLIERS[nextWord];
      resultWords.push(String(base * mult));
      i += 2;
      continue;
    }

    resultWords.push(words[i]);
    i++;
  }

  const combined = resultWords.join(' ').trim();
  return deduplicateRepeatedPhrases(combined);
}

/**
 * Removes duplicate repetitions caused by speech recognition interim/final overlap
 * e.g. "sabudana 20 sabudana 20" -> "sabudana 20"
 * e.g. "petrol 500 petrol 500" -> "petrol 500"
 */
export function deduplicateRepeatedPhrases(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  const tokens = trimmed.split(' ').filter(Boolean);

  if (tokens.length < 2) return trimmed;

  // Check if string consists of two identical halves: e.g. ["sabudana", "20", "sabudana", "20"]
  if (tokens.length % 2 === 0) {
    const mid = tokens.length / 2;
    const firstHalf = tokens.slice(0, mid).join(' ').toLowerCase();
    const secondHalf = tokens.slice(mid).join(' ').toLowerCase();
    if (firstHalf === secondHalf) {
      return tokens.slice(0, mid).join(' ');
    }
  }

  // Check if there are consecutive identical phrases of length k
  for (let k = 1; k <= Math.floor(tokens.length / 2); k++) {
    const first = tokens.slice(0, k).join(' ').toLowerCase();
    const second = tokens.slice(k, k * 2).join(' ').toLowerCase();
    if (first === second && k * 2 === tokens.length) {
      return tokens.slice(0, k).join(' ');
    }
  }

  return trimmed;
}
