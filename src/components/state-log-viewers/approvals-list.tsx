import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { MetaMaskStateLog, PendingApproval, MobileApproval } from "@/types/state-log";
import { formatDate } from "@/lib/utils";
import { SearchIcon, ShieldAlertIcon, AlertTriangleIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

interface ApprovalsListProps {
  stateLog: MetaMaskStateLog;
}

// Unified approval type that combines PendingApproval and MobileApproval
type UnifiedApproval = {
  id: string;
  origin: string;
  type: string;
  time: number;
  requestData: Record<string, unknown>;
  isMobile?: boolean;
};

export function ApprovalsList({ stateLog }: ApprovalsListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const approvals = useMemo(() => {
    console.log("Processing stateLog for approvals:", stateLog);

    if (!stateLog) {
      return [];
    }

    const approvalsList: UnifiedApproval[] = [];

    // Check if we have pendingApprovals at the root level (standard format)
    if (!stateLog.metamask) {
      console.log("No metamask property in state log");

      if (stateLog.pendingApprovals && typeof stateLog.pendingApprovals === 'object') {
        console.log("Found pendingApprovals at root level:", stateLog.pendingApprovals);
        for (const [id, approval] of Object.entries(stateLog.pendingApprovals)) {
          if (approval) {
            approvalsList.push({
              ...approval,
              id
            });
          }
        }
      }

      // Check for mobile approvals when there's no metamask property
      if (stateLog.engine?.backgroundState?.ApprovalController?.pendingApprovals) {
        console.log("Found mobile pendingApprovals:",
          stateLog.engine.backgroundState.ApprovalController.pendingApprovals);

        for (const [id, approval] of Object.entries(stateLog.engine.backgroundState.ApprovalController.pendingApprovals)) {
          if (approval) {
            approvalsList.push({
              ...approval,
              id,
              isMobile: true
            });
          }
        }
      }

      // Check for mobile permissions in PermissionController
      if (stateLog.engine?.backgroundState?.PermissionController?.subjects) {
        console.log("Found mobile permissions in PermissionController:",
          stateLog.engine.backgroundState.PermissionController.subjects);

        for (const [subject, data] of Object.entries(stateLog.engine.backgroundState.PermissionController.subjects)) {
          if (data?.permissions) {
            for (const [permission, details] of Object.entries(data.permissions)) {
              if (details) {
                approvalsList.push({
                  id: `${subject}-${permission}`,
                  origin: data.origin || subject,
                  type: details.parentCapability || permission,
                  time: details.date || Date.now(),
                  requestData: {
                    permission: details.parentCapability || permission,
                    caveats: details.caveats || []
                  },
                  isMobile: true
                });
              }
            }
          }
        }
      }

      return approvalsList;
    }

    // Standard extension format - check for pendingApprovals in metamask object
    if (stateLog.metamask.pendingApprovals && typeof stateLog.metamask.pendingApprovals === 'object') {
      console.log("Processing metamask.pendingApprovals:", stateLog.metamask.pendingApprovals);
      for (const [id, approval] of Object.entries(stateLog.metamask.pendingApprovals)) {
        if (approval) {
          approvalsList.push({
            ...approval,
            id
          });
        }
      }
    }

    // Check for mobile approvals even if metamask property exists
    if (stateLog.engine?.backgroundState?.ApprovalController?.pendingApprovals) {
      console.log("Found mobile pendingApprovals with metamask property:",
        stateLog.engine.backgroundState.ApprovalController.pendingApprovals);

      for (const [id, approval] of Object.entries(stateLog.engine.backgroundState.ApprovalController.pendingApprovals)) {
        if (approval) {
          approvalsList.push({
            ...approval,
            id,
            isMobile: true
          });
        }
      }
    }

    // Check for mobile permissions in PermissionController
    if (stateLog.engine?.backgroundState?.PermissionController?.subjects) {
      console.log("Found mobile permissions in PermissionController with metamask property:",
        stateLog.engine.backgroundState.PermissionController.subjects);

      for (const [subject, data] of Object.entries(stateLog.engine.backgroundState.PermissionController.subjects)) {
        if (data?.permissions) {
          for (const [permission, details] of Object.entries(data.permissions)) {
            if (details) {
              approvalsList.push({
                id: `${subject}-${permission}`,
                origin: data.origin || subject,
                type: details.parentCapability || permission,
                time: details.date || Date.now(),
                requestData: {
                  permission: details.parentCapability || permission,
                  caveats: details.caveats || []
                },
                isMobile: true
              });
            }
          }
        }
      }
    }

    // Also look for approvals in the permissionHistory (standard extension format)
    if (stateLog.metamask.permissionHistory) {
      console.log("Processing permissionHistory for approvals");
      for (const [origin, permissions] of Object.entries(stateLog.metamask.permissionHistory)) {
        for (const [permission, details] of Object.entries(permissions)) {
          if (details.lastApproved) {
            approvalsList.push({
              id: `${origin}-${permission}`,
              origin,
              type: permission,
              time: details.lastApproved,
              requestData: {
                permission,
                accounts: details.accounts || []
              }
            });
          }
        }
      }
    }

    // Sort by time descending
    return approvalsList.sort((a, b) => b.time - a.time);
  }, [stateLog]);

  const filteredApprovals = useMemo(() => {
    if (!searchTerm) return approvals;
    const term = searchTerm.toLowerCase();

    return approvals.filter(approval =>
      (approval.origin?.toLowerCase().includes(term)) ||
      (approval.type?.toLowerCase().includes(term))
    );
  }, [approvals, searchTerm]);

  if (approvals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approvals</CardTitle>
          <CardDescription>No approvals found in this state log</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-sm mt-2">
            <p>If you believe your log should contain approvals, please check that:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>You're using a complete state log file from MetaMask</li>
              <li>You've given permissions to dapps or approved token transactions</li>
              <li>Your MetaMask version records approval history</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Function to determine if an approval is potentially malicious
  const getApprovalRiskLevel = (approval: UnifiedApproval) => {
    // Consider all token approvals as medium risk at minimum
    if (approval.type?.includes('eth_sendTransaction') ||
        approval.type?.includes('wallet_watchAsset') ||
        approval.type?.includes('wallet_addEthereumChain')) {
      return {
        level: "medium",
        icon: <AlertTriangleIcon className="h-4 w-4 text-yellow-500" />
      };
    }

    // High risk for full access approvals
    if (approval.type?.includes('eth_sign') ||
        approval.type?.includes('personal_sign') ||
        approval.type?.includes('wallet_requestPermissions')) {
      return {
        level: "high",
        icon: <ShieldAlertIcon className="h-4 w-4 text-red-500" />
      };
    }

    // Low risk for other approvals
    return {
      level: "low",
      icon: null
    };
  };

  // Count mobile vs standard approvals
  const mobileApprovalCount = approvals.filter(a => a.isMobile).length;
  const standardApprovalCount = approvals.length - mobileApprovalCount;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Approvals</CardTitle>
        <CardDescription>
          Found {approvals.length} approvals in this state log
          {mobileApprovalCount > 0 && ` (${mobileApprovalCount} from mobile, ${standardApprovalCount} from extension)`}
        </CardDescription>
        <div className="relative mt-2">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by origin or type"
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
                <TableHead>Origin</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApprovals.map((approval) => {
                const { level, icon } = getApprovalRiskLevel(approval);

                return (
                  <TableRow key={approval.id}>
                    <TableCell className="font-medium">
                      {approval.origin || 'Unknown'}
                    </TableCell>
                    <TableCell>{approval.type || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {icon}
                        <span className={
                          level === "high"
                            ? "ml-1 text-red-600 dark:text-red-400"
                            : level === "medium"
                              ? "ml-1 text-yellow-600 dark:text-yellow-400"
                              : "ml-1 text-green-600 dark:text-green-400"
                        }>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(approval.time)}</TableCell>
                    <TableCell>
                      <span className={approval.isMobile ? "text-blue-600 dark:text-blue-400" : ""}>
                        {approval.isMobile ? "Mobile" : "Extension"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={approval.id}>
                          <AccordionTrigger className="py-1">View Details</AccordionTrigger>
                          <AccordionContent>
                            <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-48">
                              {JSON.stringify(approval.requestData, null, 2)}
                            </pre>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
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
