import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { truncateAddress, formatAmount, formatTimestamp } from '../format';

describe('format utilities', () => {
  describe('truncateAddress', () => {
    it('truncates a full Ethereum address correctly', () => {
      const addr = '0x1234567890abcdef1234567890abcdef12345678';
      expect(truncateAddress(addr)).toBe('0x1234...5678');
    });

    it('returns short addresses unchanged', () => {
      expect(truncateAddress('0x123')).toBe('0x123');
    });

    it('handles empty string', () => {
      expect(truncateAddress('')).toBe('');
    });
  });

  describe('formatAmount', () => {
    it('formats valid amounts with 2 decimals', () => {
      expect(formatAmount('1.5')).toBe('1.50');
      expect(formatAmount('0.123456')).toBe('0.12');
      expect(formatAmount('100')).toBe('100.00');
    });

    it('handles invalid amounts', () => {
      expect(formatAmount('invalid')).toBe('0.00');
      expect(formatAmount('')).toBe('0.00');
    });

    it('handles zero', () => {
      expect(formatAmount('0')).toBe('0.00');
    });
  });

  describe('formatTimestamp', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('formats recent timestamps as relative time', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
      expect(formatTimestamp(thirtyMinAgo)).toBe('30m ago');

      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatTimestamp(twoHoursAgo)).toBe('2h ago');

      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatTimestamp(threeDaysAgo)).toBe('3d ago');
    });

    it('formats old timestamps as absolute date', () => {
      const now = new Date('2024-01-15T12:00:00Z');
      vi.setSystemTime(now);

      const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatTimestamp(eightDaysAgo);
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });

    it('handles just now', () => {
      const now = new Date();
      vi.setSystemTime(now);
      expect(formatTimestamp(now.toISOString())).toBe('Just now');
    });

    it('handles invalid timestamps', () => {
      const result = formatTimestamp('invalid');
      expect(result).toContain('Invalid');
    });
  });
});
