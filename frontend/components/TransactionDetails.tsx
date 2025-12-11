'use client';

import { Transaction } from '@/lib/types';
import { formatAmount, formatTimestamp, copyToClipboard } from '@/lib/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type TransactionDetailsProps = {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
};

export function TransactionDetails({ transaction, open, onClose }: TransactionDetailsProps) {
  const { toast } = useToast();

  if (!transaction) return null;

  const handleCopy = async (text: string, label: string) => {
    try {
      await copyToClipboard(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-700 hover:bg-green-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-700 hover:bg-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20';
    }
  };

  const calculateFee = () => {
    if (!transaction.gasLimit || !transaction.gasPrice) return 'N/A';
    const fee = parseFloat(transaction.gasLimit) * parseFloat(transaction.gasPrice);
    return isNaN(fee) ? 'N/A' : fee.toFixed(8);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-sm bg-muted px-3 py-2 rounded flex-1 break-all">
                {transaction.hash}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(transaction.hash, 'Transaction hash')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">From Address</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm bg-muted px-3 py-2 rounded flex-1 break-all">
                  {transaction.fromAddress}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(transaction.fromAddress, 'From address')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">To Address</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm bg-muted px-3 py-2 rounded flex-1 break-all">
                  {transaction.toAddress}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(transaction.toAddress, 'To address')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Amount</label>
              <p className="text-lg font-semibold mt-1">
                {formatAmount(transaction.amount)} ETH
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge className={getStatusColor(transaction.status)} variant="outline">
                  {transaction.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Gas Limit</label>
              <p className="text-sm mt-1">{transaction.gasLimit || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Gas Price</label>
              <p className="text-sm mt-1">{transaction.gasPrice || 'N/A'}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Transaction Fee</label>
            <p className="text-sm mt-1">{calculateFee()} ETH</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
            <p className="text-sm mt-1">{formatTimestamp(transaction.timestamp)}</p>
          </div>

          <div className="pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(`https://etherscan.io/tx/${transaction.hash}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
