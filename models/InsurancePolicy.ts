import { InsurancePolicy } from '@/types/vault';

export function validateInsurance(p: Partial<InsurancePolicy>): { isValid: boolean; reason?: string } {
  if (!p.policyName || p.policyName.trim().length < 2) return { isValid: false, reason: 'Policy name is required' };
  if (!p.provider || p.provider.trim().length < 2)     return { isValid: false, reason: 'Provider is required' };
  if (!p.policyNumber || p.policyNumber.trim().length < 2) return { isValid: false, reason: 'Policy number is required' };
  
  if (p.category !== 'puc' && p.category !== 'license') {
    if (!p.holderName || p.holderName.trim().length < 2) return { isValid: false, reason: 'Holder name is required' };
    if (p.premiumAmount == null || isNaN(Number(p.premiumAmount)) || Number(p.premiumAmount) < 0)
      return { isValid: false, reason: 'Premium amount must be a valid number' };
  }
  if (!p.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(p.startDate))
    return { isValid: false, reason: 'Start date must be YYYY-MM-DD' };
  if (!p.nextDueDate || !/^\d{4}-\d{2}-\d{2}$/.test(p.nextDueDate))
    return { isValid: false, reason: 'Next due date must be YYYY-MM-DD' };
  return { isValid: true };
}
