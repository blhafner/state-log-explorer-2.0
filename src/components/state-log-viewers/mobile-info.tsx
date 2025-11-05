import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { MetaMaskStateLog, Transaction } from "@/types/state-log";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface MobileInfoProps {
  stateLog: MetaMaskStateLog;
}

type MobileVariable = {
  id: string;
  label: string;
  value: string | boolean | number | undefined | string[];
  type: string;
};

export function MobileInfo({ stateLog }: MobileInfoProps) {
  const mobileVariables = useMemo(() => {
    if (!stateLog) {
      return [];
    }

    const variables: MobileVariable[] = [
      {
        id: 'submittedTime',
        label: 'Submitted Time',
        value: stateLog.submittedTime,
        type: 'date',
      },
      {
        id: 'visitedDappsByHostname',
        label: 'Visited Dapps',
        value: stateLog.metamask?.visitedDappsByHostname?.join(', ') || 'None',
        type: 'string',
      },
      {
        id: 'origin',
        label: 'TX Origin',
        value: getFirstTransactionOrigin(stateLog),
        type: 'site',
      },
      {
        id: 'seedphraseBackedUp',
        label: 'Seedphrase Backed Up',
        value: stateLog.seedphraseBackedUp,
        type: 'boolean',
      },
      {
        id: 'automaticSecurityChecksEnabled',
        label: 'Automatic Security Checks Enabled',
        value: stateLog.automaticSecurityChecksEnabled,
        type: 'boolean',
      },
      {
        id: 'securityAlertsEnabled',
        label: 'Security Alerts Enabled',
        value: stateLog.securityAlertsEnabled,
        type: 'boolean',
      },
      {
        id: 'isProfileSyncingEnabled',
        label: 'Profile Syncing Enabled',
        value: stateLog.isProfileSyncingEnabled,
        type: 'boolean',
      },
      {
        id: 'hasAccountSyncingSyncedAtLeastOnce',
        label: 'Account Syncing Has Synced At Least Once',
        value: stateLog.hasAccountSyncingSyncedAtLeastOnce,
        type: 'boolean',
      }
    ];

    // Add additional variables from the engine section if available
    if (stateLog.engine?.backgroundState) {
      const backgroundState = stateLog.engine.backgroundState;

      // Check if we have the NetworkController info
      if (backgroundState.NetworkController) {
        const networkController = backgroundState.NetworkController;

        if (networkController.network) {
          variables.push({
            id: 'networkType',
            label: 'Network Type',
            value: networkController.network,
            type: 'string',
          });
        }

        if (networkController.provider?.chainId) {
          variables.push({
            id: 'chainId',
            label: 'Chain ID',
            value: networkController.provider.chainId,
            type: 'string',
          });
        }

        if (networkController.provider?.nickname) {
          variables.push({
            id: 'networkName',
            label: 'Network Name',
            value: networkController.provider.nickname,
            type: 'string',
          });
        }

        if (networkController.provider?.type) {
          variables.push({
            id: 'networkProviderType',
            label: 'Network Provider Type',
            value: networkController.provider.type,
            type: 'string',
          });
        }

        if (networkController.provider?.rpcUrl) {
          variables.push({
            id: 'rpcUrl',
            label: 'RPC URL',
            value: networkController.provider.rpcUrl,
            type: 'string',
          });
        }
      }

      // Check if we have PreferencesController info
      if (backgroundState.PreferencesController) {
        const preferencesController = backgroundState.PreferencesController;

        if (preferencesController.selectedAddress) {
          variables.push({
            id: 'selectedAddress',
            label: 'Selected Address',
            value: preferencesController.selectedAddress,
            type: 'address',
          });
        }

        if (preferencesController.lastUserActivityTime) {
          variables.push({
            id: 'lastUserActivityTime',
            label: 'Last User Activity',
            value: preferencesController.lastUserActivityTime,
            type: 'timestamp',
          });
        }

        if (preferencesController.metamask?.version) {
          variables.push({
            id: 'metamaskVersion',
            label: 'MetaMask Version',
            value: preferencesController.metamask.version,
            type: 'string',
          });
        }

        if (preferencesController.identities) {
          const identityCount = Object.keys(preferencesController.identities).length;
          variables.push({
            id: 'identityCount',
            label: 'Number of Identities',
            value: identityCount,
            type: 'number',
          });
        }

        // Feature flags
        if (preferencesController.featureFlags) {
          const featureFlags = preferencesController.featureFlags;
          for (const [key, value] of Object.entries(featureFlags)) {
            if (typeof value === 'boolean') {
              variables.push({
                id: `featureFlag_${key}`,
                label: `Feature Flag: ${key}`,
                value: value,
                type: 'boolean',
              });
            }
          }
        }
      }

      // AppStateController info
      if (backgroundState.AppStateController) {
        const appStateController = backgroundState.AppStateController;

        if (appStateController.lastActiveTime) {
          variables.push({
            id: 'lastActiveTime',
            label: 'Last Active Time',
            value: appStateController.lastActiveTime,
            type: 'timestamp',
          });
        }

        if (appStateController.versions?.metamask) {
          variables.push({
            id: 'appMetamaskVersion',
            label: 'App MetaMask Version',
            value: appStateController.versions.metamask,
            type: 'string',
          });
        }
      }

      // SecurityController info
      if (backgroundState.SecurityController) {
        const securityController = backgroundState.SecurityController;

        if (securityController.automaticSecurityChecksEnabled !== undefined) {
          variables.push({
            id: 'securityAutomaticChecks',
            label: 'Security: Automatic Checks',
            value: securityController.automaticSecurityChecksEnabled,
            type: 'boolean',
          });
        }

        if (securityController.securityAlertsEnabled !== undefined) {
          variables.push({
            id: 'securityAlerts',
            label: 'Security: Alerts Enabled',
            value: securityController.securityAlertsEnabled,
            type: 'boolean',
          });
        }
      }

      // BackupController info
      if (backgroundState.BackupController) {
        const backupController = backgroundState.BackupController;

        if (backupController.seedphraseBackedUp !== undefined) {
          variables.push({
            id: 'backupSeedphrase',
            label: 'Backup: Seedphrase Backed Up',
            value: backupController.seedphraseBackedUp,
            type: 'boolean',
          });
        }
      }

      // SyncController info
      if (backgroundState.SyncController) {
        const syncController = backgroundState.SyncController;

        if (syncController.isProfileSyncingEnabled !== undefined) {
          variables.push({
            id: 'syncProfileEnabled',
            label: 'Sync: Profile Syncing Enabled',
            value: syncController.isProfileSyncingEnabled,
            type: 'boolean',
          });
        }

        if (syncController.isProfileSyncingUpdateLoading !== undefined) {
          variables.push({
            id: 'syncProfileLoading',
            label: 'Sync: Profile Update Loading',
            value: syncController.isProfileSyncingUpdateLoading,
            type: 'boolean',
          });
        }

        if (syncController.hasAccountSyncingSyncedAtLeastOnce !== undefined) {
          variables.push({
            id: 'syncAccountSyncedOnce',
            label: 'Sync: Account Synced At Least Once',
            value: syncController.hasAccountSyncingSyncedAtLeastOnce,
            type: 'boolean',
          });
        }
      }

      // ApprovalController info
      if (backgroundState.ApprovalController) {
        const approvalController = backgroundState.ApprovalController;

        if (approvalController.pendingApprovals) {
          const pendingCount = Object.keys(approvalController.pendingApprovals).length;
          variables.push({
            id: 'pendingApprovalsCount',
            label: 'Pending Approvals Count',
            value: pendingCount,
            type: 'number',
          });
        }

        if (approvalController.approvalFlows) {
          variables.push({
            id: 'approvalFlowsCount',
            label: 'Approval Flows Count',
            value: approvalController.approvalFlows.length,
            type: 'number',
          });
        }
      }

      // PermissionController info
      if (backgroundState.PermissionController?.subjects) {
        const subjectCount = Object.keys(backgroundState.PermissionController.subjects).length;
        variables.push({
          id: 'permissionSubjectsCount',
          label: 'Permission Subjects Count',
          value: subjectCount,
          type: 'number',
        });
      }

      // Add info about number of accounts
      if (backgroundState.AccountTrackerController?.accounts) {
        const accountCount = Object.keys(backgroundState.AccountTrackerController.accounts).length;
        variables.push({
          id: 'accountCount',
          label: 'Number of Accounts',
          value: accountCount,
          type: 'number',
        });
      }

      // Add info about number of transactions (optimized)
      if (backgroundState.TransactionController?.transactions) {
        const txs = backgroundState.TransactionController.transactions;
        const txCount = Array.isArray(txs) ? txs.length : Object.keys(txs).length;
        variables.push({
          id: 'transactionCount',
          label: 'Number of Transactions',
          value: txCount,
          type: 'number',
        });
      }

      // TokenBalancesController info
      if (backgroundState.TokenBalancesController?.contractBalances) {
        const tokenCount = Object.keys(backgroundState.TokenBalancesController.contractBalances).length;
        variables.push({
          id: 'tokenBalancesCount',
          label: 'Token Balances Count',
          value: tokenCount,
          type: 'number',
        });
      }
    }

    return variables.filter(item => item.value !== undefined && item.value !== null) as MobileVariable[];
  }, [stateLog]);

  if (!stateLog || mobileVariables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mobile Information</CardTitle>
          <CardDescription>No mobile-specific information found in this state log</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Helper function to format values based on type (optimized)
  const formatValue = (item: MobileVariable) => {
    if (item.value === undefined || item.value === null) return 'Not available';

    switch (item.type) {
      case 'boolean':
        return item.value ? 'Yes' : 'No';
      case 'date':
        return new Date(item.value.toString()).toLocaleString();
      case 'timestamp':
        return new Date(Number(item.value)).toLocaleString();
      case 'address':
        return `${String(item.value).slice(0, 6)}...${String(item.value).slice(-4)}`;
      case 'site':
        return String(item.value);
      default:
        return String(item.value);
    }
  };

  // Determine if this is likely a mobile state log
  const isMobileStateLog = mobileVariables.length >= 3 || !!stateLog.engine?.backgroundState;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Mobile Information</CardTitle>
        <CardDescription>
          {isMobileStateLog
            ? "This appears to be a MetaMask Mobile state log"
            : "This state log contains some mobile data, but may not be from MetaMask Mobile"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/2">Setting</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mobileVariables.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.label}
                  </TableCell>
                  <TableCell>
                    {formatValue(item)}
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

// Optimized helper function to get the origin of the first transaction
function getFirstTransactionOrigin(stateLog: MetaMaskStateLog): string | undefined {
  // Use a more efficient approach - check mobile first, then desktop
  const sources = [
    stateLog.engine?.backgroundState?.TransactionController?.transactions,
    stateLog.metamask?.transactions,
    stateLog.transactions // fallback to root level
  ];

  for (const txs of sources) {
    if (!txs) continue;

    if (Array.isArray(txs)) {
      if (txs.length > 0 && txs[0].origin) {
        return txs[0].origin;
      }
    } else {
      // Handle object format - get first key without creating array
      for (const key in txs) {
        if (txs[key].origin) {
          return (txs as Record<string, Transaction>)[key].origin;
        }
        break; // Only check first transaction
      }
    }
  }

  return undefined;
}
