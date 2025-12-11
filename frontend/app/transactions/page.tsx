'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { transactionsAPI } from '@/lib/api';
import { Transaction } from '@/lib/types';
import { formatAmount, formatTimestamp, truncateAddress, copyToClipboard } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, ChevronUp, ChevronDown, Search, X, ArrowUpDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SortField = 'date' | 'amount' | 'status';
type SortOrder = 'asc' | 'desc';

export default function TransactionsPage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionsAPI.getAll();
      setTransactions(response.data.data);
    } catch (err) {
      setError('Failed to load transactions. Please try again.');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactions];

    if (statusFilter !== 'all') {
      result = result.filter(tx => tx.status === statusFilter);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      result = result.filter(tx => new Date(tx.timestamp) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(tx => new Date(tx.timestamp) <= toDate);
    }

    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(tx =>
        tx.hash.toLowerCase().includes(query) ||
        tx.fromAddress.toLowerCase().includes(query) ||
        tx.toAddress.toLowerCase().includes(query)
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'date') {
        comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      } else if (sortField === 'amount') {
        comparison = parseFloat(a.amount) - parseFloat(b.amount);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transactions, statusFilter, dateFrom, dateTo, debouncedSearch, sortField, sortOrder]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedTransactions.slice(start, end);
  }, [filteredAndSortedTransactions, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage);
  const showingFrom = filteredAndSortedTransactions.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const showingTo = Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length);

  const clearFilters = () => {
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

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

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    }
    return sortOrder === 'asc' ? 
      <ChevronUp className="ml-2 h-4 w-4" /> : 
      <ChevronDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">
          Manage your blockchain transactions
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by hash or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From date"
          className="w-full sm:w-[180px]"
        />

        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To date"
          className="w-full sm:w-[180px]"
        />

        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full sm:w-auto"
        >
          Clear Filters
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchTransactions}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && filteredAndSortedTransactions.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            {transactions.length === 0
              ? 'No transactions found. Create your first transaction to get started.'
              : 'No transactions match your filters. Try adjusting your search criteria.'}
          </p>
        </div>
      )}

      {!loading && !error && filteredAndSortedTransactions.length > 0 && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Timestamp
                      <SortIcon field="date" />
                    </button>
                  </TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('amount')}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Amount
                      <SortIcon field="amount" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center font-medium hover:text-foreground"
                    >
                      Status
                      <SortIcon field="status" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.map((tx) => (
                  <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(tx.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm">{truncateAddress(tx.hash)}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(tx.hash, 'Transaction hash');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm">{truncateAddress(tx.fromAddress)}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(tx.fromAddress, 'From address');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm">{truncateAddress(tx.toAddress)}</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(tx.toAddress, 'To address');
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(tx.amount)} ETH
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(tx.status)} variant="outline">
                        {tx.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {showingFrom}–{showingTo} of {filteredAndSortedTransactions.length} transactions
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>

              <div className="flex gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-9"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

