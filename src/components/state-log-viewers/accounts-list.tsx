import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { MetaMaskStateLog } from "@/types/state-log";
import { truncateAddress, formatEther, getAddressExplorerUrl } from "@/lib/utils";
import { ExternalLinkIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface AccountsListProps {
  stateLog: MetaMaskStateLog;
}

export function AccountsList({ stateLog }: AccountsListProps) {
  const accounts = useMemo(() => {
    if (!stateLog) {
      return [];
    }

    const accountsList: {
      address: string;
      name: string;
      balance: string;
    }[] = [];

    // Standard extension format accounts
    if (stateLog.metamask?.accounts) {
      if (typeof stateLog.metamask.accounts === 'object') {
        for (const [address, value] of Object.entries(stateLog.metamask.accounts)) {
          let name = address;
          const balance = value;

          // Try to get account name from identities
          if (stateLog.metamask.identities?.[address]) {
            name = stateLog.metamask.identities[address].name;
          }

          accountsList.push({
            address,
            name,
            balance
          });
        }
      }
    }

    // Mobile format accounts
    if (stateLog.engine?.backgroundState?.AccountTrackerController?.accounts) {
      const mobileAccounts = stateLog.engine.backgroundState.AccountTrackerController.accounts;

      for (const [address, accountInfo] of Object.entries(mobileAccounts)) {
        // Check if account already exists in the list to avoid duplicates
        if (!accountsList.some(acct => acct.address.toLowerCase() === address.toLowerCase())) {
          let name = address;
          const balance = accountInfo.balance;

          // Try to get account name from identities in mobile format
          if (stateLog.engine.backgroundState.PreferencesController?.identities?.[address]) {
            name = stateLog.engine.backgroundState.PreferencesController.identities[address].name;
          }

          accountsList.push({
            address,
            name,
            balance
          });
        }
      }
    }

    return accountsList;
  }, [stateLog]);

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>No accounts found in this state log</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Accounts</CardTitle>
        <CardDescription>
          Found {accounts.length} accounts in this state log
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.address}>
                  <TableCell className="font-medium">
                    {account.name}
                  </TableCell>
                  <TableCell>
                    <a
                      href={getAddressExplorerUrl(account.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {truncateAddress(account.address)}
                      <ExternalLinkIcon className="ml-1 h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    {formatEther(account.balance)} ETH
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
