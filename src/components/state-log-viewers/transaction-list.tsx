import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MetaMaskStateLog, Transaction } from "@/types/state-log";
import { formatDate, truncateAddress, formatEther } from "@/lib/utils";
import { ExternalLinkIcon, SearchIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface TransactionListProps {
  stateLog: MetaMaskStateLog;
}

export function TransactionList({ stateLog }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const transactions = useMemo(() => {
    console.log("Processing stateLog for transactions:", stateLog);

    if (!stateLog) {
      return [];
    }

    const txList: Transaction[] = [];

    // Check if we have the metamask property
    if (!stateLog.metamask) {
      console.log("No metamask property found in state log");

      // Some versions of state logs might have the data at the top level
      if (stateLog.transactions) {
        console.log("Found transactions at root level:", stateLog.transactions);
        if (Array.isArray(stateLog.transactions)) {
          txList.push(...stateLog.transactions);
        } else if (typeof stateLog.transactions === 'object') {
          for (const tx of Object.values(stateLog.transactions)) {
            if (tx) txList.push(tx as Transaction);
          }
        }
      }

      // Check for mobile structure with engine.backgroundState.AccountTrackerController
      if (stateLog.engine?.backgroundState?.AccountTrackerController?.accounts) {
        console.log("Found mobile engine structure with accounts:", stateLog.engine.backgroundState.AccountTrackerController.accounts);

        // Process transactions from engine.backgroundState.TransactionController if available
        if (stateLog.engine?.backgroundState?.TransactionController?.transactions) {
          console.log("Found transactions in mobile engine.backgroundState.TransactionController:",
            stateLog.engine.backgroundState.TransactionController.transactions);

          const mobileTxs = stateLog.engine.backgroundState.TransactionController.transactions;
          if (Array.isArray(mobileTxs)) {
            txList.push(...mobileTxs);
          } else if (typeof mobileTxs === 'object') {
            for (const tx of Object.values(mobileTxs)) {
              if (tx) txList.push(tx as Transaction);
            }
          }
        }
      }

      return txList;
    }

    // Get transactions from both arrays and objects in the state log
    if (stateLog.metamask.transactions) {
      console.log("Processing metamask.transactions:", stateLog.metamask.transactions);
      if (Array.isArray(stateLog.metamask.transactions)) {
        txList.push(...stateLog.metamask.transactions);
      } else if (typeof stateLog.metamask.transactions === 'object') {
        for (const tx of Object.values(stateLog.metamask.transactions)) {
          if (tx) txList.push(tx as Transaction);
        }
      }
    }

    // Check for txListItems format (used in some state logs)
    if (stateLog.metamask.txListItems) {
      console.log("Processing metamask.txListItems:", stateLog.metamask.txListItems);
      if (Array.isArray(stateLog.metamask.txListItems)) {
        txList.push(...stateLog.metamask.txListItems);
      } else if (typeof stateLog.metamask.txListItems === 'object') {
        for (const tx of Object.values(stateLog.metamask.txListItems)) {
          if (tx) txList.push(tx as Transaction);
        }
      }
    }

    if (stateLog.metamask.transactionHistory && typeof stateLog.metamask.transactionHistory === 'object') {
      console.log("Processing metamask.transactionHistory:", stateLog.metamask.transactionHistory);
      for (const tx of Object.values(stateLog.metamask.transactionHistory)) {
        if (tx && !txList.some(existingTx => existingTx?.id === tx.id)) {
          txList.push(tx);
        }
      }
    }

    // Sort by time descending
    const sortedTxList = txList.sort((a, b) => (b.time || 0) - (a.time || 0));

    console.log(`Found ${sortedTxList.length} transactions total`);
    return sortedTxList;
  }, [stateLog]);

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) return transactions;
    const term = searchTerm.toLowerCase();

    return transactions.filter(tx =>
      (tx.hash?.toLowerCase().includes(term)) ||
      (tx.txParams?.from?.toLowerCase().includes(term)) ||
      (tx.txParams?.to?.toLowerCase().includes(term)) ||
      (tx.origin?.toLowerCase().includes(term))
    );
  }, [transactions, searchTerm]);

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>No transactions found in this state log</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm mt-2">
            <p>If you believe your log should contain transactions, please check that:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>You're using a complete state log file from MetaMask</li>
              <li>The state log is not corrupted</li>
              <li>The state log has a valid structure</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Transactions</CardTitle>
        <CardDescription>
          Found {transactions.length} transactions in this state log
        </CardDescription>
        <div className="relative mt-2">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by address, hash, or origin"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Transaction Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx, index) => (
                <TableRow key={tx.id || tx.hash || index}>
                  <TableCell>{tx.time ? formatDate(tx.time) : "Unknown"}</TableCell>
                  <TableCell>{truncateAddress(tx.txParams?.from)}</TableCell>
                  <TableCell>{tx.txParams?.to ? truncateAddress(tx.txParams.to) : '—'}</TableCell>
                  <TableCell>{tx.txParams?.value ? formatEther(tx.txParams.value) : '0'} ETH</TableCell>
                  <TableCell className={
                    tx.status === 'confirmed'
                      ? 'text-green-600 dark:text-green-400'
                      : tx.status === 'failed'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                  }>
                    {tx.status ? tx.status.charAt(0).toUpperCase() + tx.status.slice(1) : 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {tx.origin || '—'}
                  </TableCell>
                  <TableCell>
                    {tx.hash ? (
                      <a
                        href={`https://etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {truncateAddress(tx.hash)}
                        <ExternalLinkIcon className="ml-1 h-3 w-3" />
                      </a>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
