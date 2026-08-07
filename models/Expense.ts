import { z } from 'zod';

export const expenseSchema = z.object({
  itemName: z.string().min(2, 'Item name must be at least 2 characters'),
  amount: z.coerce.number({ message: "Amount must be a number" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  category: z.string().optional(),
  note: z.string().optional(),
  type: z.enum(['income', 'expense', 'transfer_in', 'transfer_out', 'transfer']).optional(),
  associatedType: z.string().optional(),
  associatedId: z.string().optional(),
  user_id: z.string().optional(),
  space_id: z.string().optional(),
  transfer_to_user_id: z.string().optional(),
  currency: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.associatedType) {
    if (data.amount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Amount must not be 0',
        path: ['amount']
      });
    }
  } else {
    if (data.amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Amount must be greater than 0',
        path: ['amount']
      });
    }
  }
});
