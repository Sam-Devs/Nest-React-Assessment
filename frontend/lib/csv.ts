import { Transaction } from './types';

function escapeCsv(value: string): string {
  if (value == null) return '';
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function transactionsToCsv(rows: Transaction[]): string {
  const headers = [
    'id', 'hash', 'fromAddress', 'toAddress', 'amount', 'status', 'gasLimit', 'gasPrice', 'timestamp'
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    const vals = [
      r.id,
      r.hash,
      r.fromAddress,
      r.toAddress,
      r.amount,
      r.status,
      r.gasLimit ?? '',
      r.gasPrice ?? '',
      r.timestamp,
    ].map(v => escapeCsv(String(v)));
    lines.push(vals.join(','));
  }
  return lines.join('\n');
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}