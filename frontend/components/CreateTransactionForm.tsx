'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { transactionsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const DRAFT_KEY = 'transaction_form_draft';

const createTransactionSchema = z.object({
  toAddress: z
    .string()
    .min(1, 'To address is required')
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address (0x followed by 40 hex characters)'),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Amount must be a positive number'),
  gasLimit: z.string().optional(),
  gasPrice: z.string().optional(),
});

type CreateTransactionFormData = z.infer<typeof createTransactionSchema>;

type CreateTransactionFormProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateTransactionForm({ open, onClose, onSuccess }: CreateTransactionFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CreateTransactionFormData>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      toAddress: '',
      amount: '',
      gasLimit: '21000',
      gasPrice: '0.00000002',
    },
  });

  const { watch, reset } = form;
  const watchedValues = watch();

  useEffect(() => {
    if (open) {
      try {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          reset(parsed);
        }
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, [open, reset]);

  useEffect(() => {
    if (open) {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(watchedValues));
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    }
  }, [watchedValues, open]);

  const calculateFee = () => {
    const gasLimit = parseFloat(watchedValues.gasLimit || '0');
    const gasPrice = parseFloat(watchedValues.gasPrice || '0');
    if (isNaN(gasLimit) || isNaN(gasPrice)) return '0.00000000';
    const fee = gasLimit * gasPrice;
    return fee.toFixed(8);
  };

  const onSubmit = async (data: CreateTransactionFormData) => {
    try {
      setSubmitting(true);
      const response = await transactionsAPI.create({
        toAddress: data.toAddress,
        amount: data.amount,
        gasLimit: data.gasLimit || '21000',
        gasPrice: data.gasPrice || '0.00000002',
      });

      const transaction = response.data.data;
      
      toast({
        title: 'Transaction created successfully!',
        description: `Transaction hash: ${transaction.hash}`,
      });

      localStorage.removeItem(DRAFT_KEY);
      reset({
        toAddress: '',
        amount: '',
        gasLimit: '21000',
        gasPrice: '0.00000002',
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to create transaction. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    reset({
      toAddress: '',
      amount: '',
      gasLimit: '21000',
      gasPrice: '0.00000002',
    });
    toast({
      title: 'Draft cleared',
      description: 'Form has been reset to defaults',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Transaction</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new blockchain transaction
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="toAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>To Address *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (ETH) *</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="0.0"
                      {...field}
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gasLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gas Limit (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="21000"
                      {...field}
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gasPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gas Price (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="0.00000002"
                      {...field}
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-muted p-4 rounded-md">
              <Label className="text-sm font-medium text-muted-foreground">Transaction Fee Preview</Label>
              <p className="text-lg font-semibold mt-1">{calculateFee()} ETH</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearDraft}
                disabled={submitting}
                className="flex-1"
              >
                Clear Draft
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? 'Creating...' : 'Create Transaction'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
