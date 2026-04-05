import { calculateEMI, generateAmortizationSchedule, calculateHonestyScore } from '../src/utils/finance';

describe('Finance Utilities', () => {
  describe('calculateEMI', () => {
    it('should calculate correct EMI for standard loan', () => {
      const emi = calculateEMI(100000, 12, 12);
      expect(emi).toBeCloseTo(8884.88, 1);
    });

    it('should handle zero interest rate', () => {
      const emi = calculateEMI(120000, 0, 12);
      expect(emi).toBe(10000);
    });

    it('should return correct EMI for 5-year loan', () => {
      const emi = calculateEMI(500000, 10, 60);
      expect(emi).toBeCloseTo(10623.54, 1);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('should generate correct number of installments', () => {
      const schedule = generateAmortizationSchedule(100000, 12, 12, new Date('2024-01-01'));
      expect(schedule).toHaveLength(12);
    });

    it('closing balance should reach ~0 at end', () => {
      const schedule = generateAmortizationSchedule(100000, 12, 12, new Date('2024-01-01'));
      const last = schedule[schedule.length - 1];
      expect(last.closingBalance).toBeLessThan(1);
    });

    it('each row interest should decrease (reducing balance)', () => {
      const schedule = generateAmortizationSchedule(100000, 12, 12, new Date('2024-01-01'));
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].interest).toBeLessThanOrEqual(schedule[i - 1].interest);
      }
    });
  });

  describe('calculateHonestyScore', () => {
    it('perfect record = 100 + bonuses', () => {
      const { score } = calculateHonestyScore(10, 0, 0, 0);
      expect(score).toBe(100); // clamped at 100
    });

    it('missed payments should drastically reduce score', () => {
      const { score, category } = calculateHonestyScore(0, 0, 5, 0);
      expect(score).toBe(0); // 100 - 100 = 0
      expect(category).toBe('High Risk');
    });

    it('mixed record', () => {
      const { score, category } = calculateHonestyScore(5, 2, 1, 0);
      // 100 + 10 - 14 - 20 = 76
      expect(score).toBe(76);
      expect(category).toBe('Trustworthy');
    });

    it('should clamp score to 0 minimum', () => {
      const { score } = calculateHonestyScore(0, 0, 10, 0);
      expect(score).toBe(0);
    });

    it('should clamp score to 100 maximum', () => {
      const { score } = calculateHonestyScore(100, 0, 0, 50);
      expect(score).toBe(100);
    });

    it('category boundaries', () => {
      expect(calculateHonestyScore(40, 0, 0, 0).category).toBe('Highly Trustworthy'); // 100+80=clamp 100
      const { category: c2 } = calculateHonestyScore(0, 5, 1, 0); // 100-35-20=45
      expect(c2).toBe('Medium Risk');
    });
  });
});
