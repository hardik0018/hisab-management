
export interface ParsedExpense {
  amount: number | null;
  title: string;
  category: string;
  date: string;
}

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Groceries', 'Health', 'Entertainment', 'Other'];

export function parseNaturalLanguageExpense(input: string): ParsedExpense {
  const lowercaseInput = input.toLowerCase();
  
  // Extract amount
  const amountMatch = input.match(/(\d+(?:\.\d+)?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
  
  // Extract date indicators
  let date = new Date().toISOString().split('T')[0];
  if (lowercaseInput.includes('yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    date = yesterday.toISOString().split('T')[0];
  } else if (lowercaseInput.includes('today')) {
    date = new Date().toISOString().split('T')[0];
  }
  
  // Extract category
  let category = 'Other';
  for (const cat of CATEGORIES) {
    if (lowercaseInput.includes(cat.toLowerCase())) {
      category = cat;
      break;
    }
  }
  
  // Extract title (everything except amount, 'for', 'at', 'yesterday', 'today', and categories)
  let title = input
    .replace(/(\d+(?:\.\d+)?)/, '')
    .replace(/\b(for|at|on|today|yesterday|to)\b/gi, '')
    .trim();
  
  // Cleanup title from category mentions if matched
  if (category !== 'Other') {
    const catRegex = new RegExp(`\\b${category.toLowerCase()}\\b`, 'gi');
    title = title.replace(catRegex, '').trim();
  }
  
  // If title becomes empty, use category or placeholder
  if (!title) {
    title = category !== 'Other' ? category : 'Miscellaneous Expense';
  }

  // Capitalize first letter of title
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return { amount, title, category, date };
}
