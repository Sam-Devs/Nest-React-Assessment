export type Transaction = {
  id: string;
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: string; // numeric string from API
  status: 'pending' | 'confirmed' | 'failed';
  gasLimit?: string;
  gasPrice?: string;
  timestamp: string; // ISO
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
};