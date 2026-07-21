import { Warranty } from '@/types/vault';

export function validateWarranty(w: Partial<Warranty>): { isValid: boolean; reason?: string } {
  if (!w.itemName || w.itemName.trim().length < 2) return { isValid: false, reason: 'Item name is required' };
  if (!w.purchaseDate || !/^\d{4}-\d{2}-\d{2}$/.test(w.purchaseDate))
    return { isValid: false, reason: 'Purchase date must be YYYY-MM-DD' };
  if (!w.warrantyMonths || w.warrantyMonths < 1) return { isValid: false, reason: 'Warranty months must be >= 1' };
  if (!w.expiryDate || !/^\d{4}-\d{2}-\d{2}$/.test(w.expiryDate))
    return { isValid: false, reason: 'Expiry date must be YYYY-MM-DD' };
  return { isValid: true };
}

export function computeExpiryDate(purchaseDate: string, warrantyMonths: number): string {
  const d = new Date(purchaseDate);
  d.setMonth(d.getMonth() + warrantyMonths);
  return d.toISOString().slice(0, 10);
}
