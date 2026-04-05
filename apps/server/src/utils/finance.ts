/**
 * Standard reducing balance EMI formula:
 * EMI = P * r * (1+r)^n / ((1+r)^n - 1)
 * where P = principal, r = monthly rate, n = tenure in months
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return principal / tenureMonths;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi * 100) / 100;
}

export interface AmortizationRow {
  installmentNo: number;
  dueDate: Date;
  openingBalance: number;
  principal: number;
  interest: number;
  totalAmount: number;
  closingBalance: number;
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  tenureMonths: number,
  startDate: Date
): AmortizationRow[] {
  const r = annualRate / 12 / 100;
  const emi = calculateEMI(principal, annualRate, tenureMonths);
  const schedule: AmortizationRow[] = [];
  let balance = principal;

  for (let i = 1; i <= tenureMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i - 1);

    const interest = Math.round(balance * r * 100) / 100;
    const principalPart = Math.round((emi - interest) * 100) / 100;
    const closingBalance = Math.round((balance - principalPart) * 100) / 100;

    schedule.push({
      installmentNo: i,
      dueDate,
      openingBalance: Math.round(balance * 100) / 100,
      principal: principalPart,
      interest,
      totalAmount: Math.round(emi * 100) / 100,
      closingBalance: Math.max(0, closingBalance),
    });

    balance = closingBalance;
  }

  return schedule;
}

/**
 * Honesty Score calculation
 * Score = 100 + (OnTime × 2) - (Late × 7) - (Missed × 20) + bonus
 * Clamped 0–100
 */
export function calculateHonestyScore(
  onTimePayments: number,
  latePayments: number,
  missedPayments: number,
  bonus: number = 0
): { score: number; category: string } {
  const raw = 100 + onTimePayments * 2 - latePayments * 7 - missedPayments * 20 + bonus;
  const score = Math.min(100, Math.max(0, Math.round(raw)));

  let category: string;
  if (score >= 80) category = 'Highly Trustworthy';
  else if (score >= 60) category = 'Trustworthy';
  else if (score >= 40) category = 'Medium Risk';
  else category = 'High Risk';

  return { score, category };
}

export function generateLoanNo(count: number): string {
  const year = new Date().getFullYear();
  return `SKL-${year}-${String(count + 1).padStart(4, '0')}`;
}

export function generatePaymentNo(count: number): string {
  const year = new Date().getFullYear();
  return `SKP-${year}-${String(count + 1).padStart(4, '0')}`;
}
