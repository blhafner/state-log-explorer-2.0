import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MetaMaskStateLog } from "@/types/state-log";
import { SearchIcon, AlertTriangleIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface OriginsListProps {
  stateLog: MetaMaskStateLog;
}

export function OriginsList({ stateLog }: OriginsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Collect all unique origins from transactions, approvals, and visited sites
  const originData = useMemo(() => {
    if (!stateLog?.metamask) {
      return [];
    }

    const origins = new Map<string, {
      count: number;
      lastUsed?: number;
      isVisited: boolean;
      hasTransactions: boolean;
      hasApprovals: boolean;
    }>();

    // Get origins from transactions
    if (stateLog.metamask.transactions && Array.isArray(stateLog.metamask.transactions)) {
      for (const tx of stateLog.metamask.transactions) {
        if (tx?.origin) {
          const existing = origins.get(tx.origin) || {
            count: 0,
            isVisited: false,
            hasTransactions: false,
            hasApprovals: false,
          };

          existing.count += 1;
          existing.hasTransactions = true;
          if (!existing.lastUsed || (tx.time && tx.time > existing.lastUsed)) {
            existing.lastUsed = tx.time;
          }

          origins.set(tx.origin, existing);
        }
      }
    }

    // Get origins from approvals
    if (stateLog.metamask.pendingApprovals && typeof stateLog.metamask.pendingApprovals === 'object') {
      for (const approval of Object.values(stateLog.metamask.pendingApprovals)) {
        if (approval?.origin) {
          const existing = origins.get(approval.origin) || {
            count: 0,
            isVisited: false,
            hasTransactions: false,
            hasApprovals: false,
          };

          existing.count += 1;
          existing.hasApprovals = true;
          if (!existing.lastUsed || approval.time > existing.lastUsed) {
            existing.lastUsed = approval.time;
          }

          origins.set(approval.origin, existing);
        }
      }
    }

    // Get visited URLs
    if (stateLog.metamask.visitedDappsByHostname && Array.isArray(stateLog.metamask.visitedDappsByHostname)) {
      for (const hostname of stateLog.metamask.visitedDappsByHostname) {
        if (hostname) {
          const existing = origins.get(hostname) || {
            count: 0,
            isVisited: false,
            hasTransactions: false,
            hasApprovals: false,
          };

          existing.isVisited = true;
          if (existing.count === 0) existing.count = 1;

          origins.set(hostname, existing);
        }
      }
    }

    // Convert to array for easier filtering and sorting
    return Array.from(origins.entries()).map(([url, data]) => ({
      url,
      ...data
    })).sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
  }, [stateLog]);

  const filteredOrigins = useMemo(() => {
    if (!searchTerm) return originData;
    const term = searchTerm.toLowerCase();

    return originData.filter(origin =>
      origin.url?.toLowerCase().includes(term)
    );
  }, [originData, searchTerm]);

  if (!stateLog?.metamask || originData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Origin URLs</CardTitle>
          <CardDescription>No origin URLs found in this state log</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Function to determine risk level
  const getRiskIndicator = (origin: typeof originData[0]) => {
    // Higher risk if has approvals but no transactions
    if (origin.hasApprovals && !origin.hasTransactions) {
      return { risk: "high", icon: <AlertTriangleIcon className="h-4 w-4 text-red-500" /> };
    }

    // Medium risk if has approvals
    if (origin.hasApprovals) {
      return { risk: "medium", icon: <AlertTriangleIcon className="h-4 w-4 text-yellow-500" /> };
    }

    // Low risk otherwise
    return { risk: "low", icon: null };
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Origin URLs</CardTitle>
        <CardDescription>
          Found {originData.length} origin URLs in this state log
        </CardDescription>
        <div className="relative mt-2">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by URL"
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
                <TableHead>URL</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Has Transactions</TableHead>
                <TableHead>Has Approvals</TableHead>
                <TableHead>Visited</TableHead>
                <TableHead>Last Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrigins.map((origin) => {
                const { risk, icon } = getRiskIndicator(origin);

                return (
                  <TableRow key={origin.url}>
                    <TableCell className="font-medium">
                      <a
                        href={origin.url.startsWith('http') ? origin.url : `https://${origin.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {origin.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {icon}
                        <span className={
                          risk === "high"
                            ? "ml-1 text-red-600 dark:text-red-400"
                            : risk === "medium"
                              ? "ml-1 text-yellow-600 dark:text-yellow-400"
                              : "ml-1 text-green-600 dark:text-green-400"
                        }>
                          {risk.charAt(0).toUpperCase() + risk.slice(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {origin.hasTransactions ? 'Yes' : 'No'}
                    </TableCell>
                    <TableCell>
                      {origin.hasApprovals ? 'Yes' : 'No'}
                    </TableCell>
                    <TableCell>
                      {origin.isVisited ? 'Yes' : 'No'}
                    </TableCell>
                    <TableCell>
                      {origin.lastUsed ? new Date(origin.lastUsed).toLocaleDateString() : 'Unknown'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
