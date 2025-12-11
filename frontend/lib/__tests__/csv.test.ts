import { transactionsToCsv } from '../csv';
import { Transaction } from '../types';

import { describe, it, expect } from 'vitest';

describe('CSV utilities', () => {
  describe('transactionsToCsv', () => {
    it('generates correct CSV with headers', () => {
      const txs: Transaction[] = [
        {
          id: '1',
          hash: '0xabc123',
          fromAddress: '0xfrom1',
          toAddress: '0xto1',
          amount: '1.5',
          status: 'confirmed',
          gasLimit: '21000',
          gasPrice: '0.00000002',
          timestamp: '2024-01-15T10:00:00Z',
        },
      ];

      const csv = transactionsToCsv(txs);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('id,hash,fromAddress,toAddress,amount,status,gasLimit,gasPrice,timestamp');
      expect(lines[1]).toBe('1,0xabc123,0xfrom1,0xto1,1.5,confirmed,21000,0.00000002,2024-01-15T10:00:00Z');
    });

    it('handles empty array', () => {
      const csv = transactionsToCsv([]);
      const lines = csv.split('\n');
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('id,hash,fromAddress,toAddress,amount,status,gasLimit,gasPrice,timestamp');
    });

    it('escapes values with commas', () => {
      const txs: Transaction[] = [
        {
          id: '1',
          hash: '0x,test',
          fromAddress: '0xfrom',
          toAddress: '0xto',
          amount: '1.0',
          status: 'pending',
          timestamp: '2024-01-15T10:00:00Z',
        },
      ];

      const csv = transactionsToCsv(txs);
      expect(csv).toContain('\"0x,test\"');
    });

    it('escapes quotes in values', () => {
      const txs: Transaction[] = [
        {
          id: '1',
          hash: '0x"quoted"',
          fromAddress: '0xfrom',
          toAddress: '0xto',
          amount: '1.0',
          status: 'pending',
          timestamp: '2024-01-15T10:00:00Z',
        },
      ];

      const csv = transactionsToCsv(txs);
      expect(csv).toContain('\"0x\"\"quoted\"\"\"');
    });

    it('handles missing optional fields', () => {
      const txs: Transaction[] = [
        {
          id: '1',
          hash: '0xabc',
          fromAddress: '0xfrom',
          toAddress: '0xto',
          amount: '1.0',
          status: 'pending',
          timestamp: '2024-01-15T10:00:00Z',
        },
      ];

      const csv = transactionsToCsv(txs);
      const lines = csv.split('\n');
      const vals = lines[1].split(',');
      expect(vals[6]).toBe(''); // gasLimit
      expect(vals[7]).toBe(''); // gasPrice
    });
  });
});
