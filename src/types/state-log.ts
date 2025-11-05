export interface MetaMaskStateLog {
  // Basic info
  metamask?: MetaMaskState;
  version?: string;

  // Sometimes data is at the root level in older MetaMask logs
  transactions?: Transaction[] | Record<string, Transaction>;
  transactionHistory?: Record<string, Transaction>;
  pendingApprovals?: Record<string, PendingApproval>;
  permissionHistory?: PermissionHistory;

  // Mobile specific
  submittedTime?: string;
  seedphraseBackedUp?: boolean;
  automaticSecurityChecksEnabled?: boolean;
  securityAlertsEnabled?: boolean;
  isProfileSyncingEnabled?: boolean;
  isProfileSyncingUpdateLoading?: boolean;
  hasAccountSyncingSyncedAtLeastOnce?: boolean;

  // Mobile engine state structure
  engine?: {
    backgroundState?: {
      AccountTrackerController?: {
        accounts?: Record<string, { balance: string }>;
      };
      TransactionController?: {
        transactions?: Transaction[] | Record<string, Transaction>;
      };
      TokenBalancesController?: {
        contractBalances?: Record<string, string>;
      };
      NetworkController?: {
        network?: string;
        provider?: {
          chainId?: string;
          nickname?: string;
          rpcUrl?: string;
          type?: string;
        };
      };
      PreferencesController?: {
        featureFlags?: Record<string, boolean | string | number>;
        selectedAddress?: string;
        identities?: Record<string, Identity>;
        lastUserActivityTime?: number;
        metamask?: {
          version?: string;
        };
      };
      AppStateController?: {
        lastActiveTime?: number;
        versions?: {
          metamask?: string;
        };
      };
      SecurityController?: {
        automaticSecurityChecksEnabled?: boolean;
        securityAlertsEnabled?: boolean;
      };
      BackupController?: {
        seedphraseBackedUp?: boolean;
      };
      SyncController?: {
        isProfileSyncingEnabled?: boolean;
        isProfileSyncingUpdateLoading?: boolean;
        hasAccountSyncingSyncedAtLeastOnce?: boolean;
      };
      ApprovalController?: {
        pendingApprovals?: Record<string, MobileApproval>;
        approvalFlows?: string[];
      };
      PermissionController?: {
        subjects?: Record<string, {
          permissions: Record<string, {
            parentCapability: string;
            date: number;
            caveats?: unknown[];
          }>;
          origin: string;
        }>;
      };
    };
  };
}

export interface MetaMaskState {
  accounts: Record<string, string>;
  identities?: Record<string, Identity>;
  preferences?: {
    useNativeCurrencyAsPrimaryCurrency?: boolean;
  };

  // Regular transaction lists
  transactions?: Transaction[] | Record<string, Transaction>;
  transactionHistory?: Record<string, Transaction>;

  // Transaction list items (used in some formats)
  txListItems?: Transaction[] | Record<string, Transaction>;

  // Cached balances
  cachedBalances?: Record<string, Record<string, string>>;
  networkConfigurations?: Record<string, NetworkConfiguration>;

  // Approvals and permissions
  pendingApprovals?: Record<string, PendingApproval>;
  approvalFlows?: string[];
  permissionHistory?: PermissionHistory;

  // Domain metadata
  domainMetadata?: Record<string, DomainMetadata>;
  visitedDappsByHostname?: string[];
}

export interface Identity {
  name: string;
  address: string;
  lastSelected?: number;
}

export interface Transaction {
  id?: string;
  time?: number;
  status?: string;
  txParams?: {
    from?: string;
    to?: string;
    data?: string;
    value?: string;
    gas?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
  };
  hash?: string;
  metamaskNetworkId?: string;
  chainId?: string;
  origin?: string;
  txReceipt?: {
    status?: string;
    gasUsed?: string;
  };
  verifiedOnBlockchain?: boolean;
  submittedTime?: number;
  history?: TransactionHistoryEntry[];
}

export interface TransactionHistoryEntry {
  id?: string;
  time?: number;
  status?: string;
  note?: string;
}

export interface NetworkConfiguration {
  rpcUrl: string;
  chainId: string;
  ticker: string;
  nickname: string;
}

export interface PendingApproval {
  id?: string;
  origin: string;
  requestData: Record<string, unknown>;
  time: number;
  type: string;
}

export interface PermissionHistory {
  [origin: string]: {
    [permission: string]: {
      lastApproved: number;
      accounts?: string[];
    };
  };
}

export interface DomainMetadata {
  name: string;
  icon: string;
  host: string;
}

export interface MobileApproval {
  id: string;
  origin: string;
  type: string;
  time: number;
  requestData: Record<string, unknown>;
  requestState?: Record<string, unknown>;
}

export interface SignatureRequest {
  id?: string;
  signingMethod?: string;
  request_source?: string;
  time?: number;
  origin?: string;
  status?: string;
  from?: string;
  data?: Record<string, unknown>;
  name?: string;
  hash?: string;
  timestamp?: number;
}
