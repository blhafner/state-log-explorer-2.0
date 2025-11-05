import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import type { MetaMaskStateLog } from "@/types/state-log";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

interface VariableViewerProps {
  stateLog: MetaMaskStateLog;
}

type VariableValue = string | number | boolean | unknown;

export function VariableViewer({ stateLog }: VariableViewerProps) {
  // Get various variables of interest
  const variables = useMemo(() => {
    if (!stateLog) {
      return [];
    }

    // Check for values in various locations
    const getVariableValue = (key: string, fallbackValue = 'Not available'): VariableValue => {
      // First try direct access at top level
      if (stateLog[key as keyof MetaMaskStateLog] !== undefined) {
        return stateLog[key as keyof MetaMaskStateLog] as VariableValue;
      }

      // Check in engine.backgroundState.PreferencesController
      if (stateLog.engine?.backgroundState?.PreferencesController?.[key as keyof object] !== undefined) {
        return stateLog.engine.backgroundState.PreferencesController[key as keyof object] as VariableValue;
      }

      // Check in engine.backgroundState
      if (stateLog.engine?.backgroundState?.[key as keyof object] !== undefined) {
        return stateLog.engine.backgroundState[key as keyof object] as VariableValue;
      }

      // Check in metamask property
      if (stateLog.metamask?.[key as keyof object] !== undefined) {
        return stateLog.metamask[key as keyof object] as VariableValue;
      }

      return fallbackValue;
    };

    // Format a value based on its type
    const formatValue = (value: unknown): string => {
      if (value === undefined || value === null) {
        return 'Not available';
      }

      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }

      if (typeof value === 'string') {
        // Check if it looks like a date string (has digits, dashes, and possibly 'T')
        if (/\d{4}-\d{2}-\d{2}/.test(value) || /\d+T\d+/.test(value)) {
          try {
            return new Date(value).toLocaleString();
          } catch (e) {
            return value;
          }
        }
        return value;
      }

      if (typeof value === 'number') {
        // If it's a timestamp (large number), convert to date
        if (value > 1000000000000) { // Likely a millisecond timestamp
          return new Date(value).toLocaleString();
        }

        if (value > 1000000000) { // Likely a second timestamp
          return new Date(value * 1000).toLocaleString();
        }

        return value.toString();
      }

      return JSON.stringify(value);
    };

    // Get version information
    let versionValue: VariableValue = getVariableValue('version');

    // Look for version in more specific locations
    if (versionValue === 'Not available') {
      if (stateLog.engine?.backgroundState?.PreferencesController?.metamask?.version) {
        versionValue = stateLog.engine.backgroundState.PreferencesController.metamask.version;
      } else if (stateLog.engine?.backgroundState?.AppStateController?.versions?.metamask) {
        versionValue = stateLog.engine.backgroundState.AppStateController.versions.metamask;
      }
    }

    // Check for mobile flag to determine if this is from the mobile app
    let isMobileApp = false;
    if (stateLog.engine?.backgroundState) {
      isMobileApp = true;
    }

    // Get seedphrase backup status
    let seedphraseBackedUp: VariableValue = getVariableValue('seedphraseBackedUp');
    if (seedphraseBackedUp === 'Not available' && stateLog.engine?.backgroundState?.BackupController?.seedphraseBackedUp !== undefined) {
      seedphraseBackedUp = stateLog.engine.backgroundState.BackupController.seedphraseBackedUp;

    //Get seedphrase reveal timestamps
    
    }

    // Check for security settings in SecurityController
    let automaticSecurityChecks: VariableValue = getVariableValue('automaticSecurityChecksEnabled');
    if (automaticSecurityChecks === 'Not available' &&
        stateLog.engine?.backgroundState?.SecurityController?.automaticSecurityChecksEnabled !== undefined) {
      automaticSecurityChecks = stateLog.engine.backgroundState.SecurityController.automaticSecurityChecksEnabled;
    }

    let securityAlerts: VariableValue = getVariableValue('securityAlertsEnabled');
    if (securityAlerts === 'Not available' &&
        stateLog.engine?.backgroundState?.SecurityController?.securityAlertsEnabled !== undefined) {
      securityAlerts = stateLog.engine.backgroundState.SecurityController.securityAlertsEnabled;
    }

    // Check for profile syncing settings
    let profileSyncing: VariableValue = getVariableValue('isProfileSyncingEnabled');
    if (profileSyncing === 'Not available' &&
        stateLog.engine?.backgroundState?.SyncController?.isProfileSyncingEnabled !== undefined) {
      profileSyncing = stateLog.engine.backgroundState.SyncController.isProfileSyncingEnabled;
    }

    let profileSyncingUpdate: VariableValue = getVariableValue('isProfileSyncingUpdateLoading');
    if (profileSyncingUpdate === 'Not available' &&
        stateLog.engine?.backgroundState?.SyncController?.isProfileSyncingUpdateLoading !== undefined) {
      profileSyncingUpdate = stateLog.engine.backgroundState.SyncController.isProfileSyncingUpdateLoading;
    }

    let accountSyncedOnce: VariableValue = getVariableValue('hasAccountSyncingSyncedAtLeastOnce');
    if (accountSyncedOnce === 'Not available' &&
        stateLog.engine?.backgroundState?.SyncController?.hasAccountSyncingSyncedAtLeastOnce !== undefined) {
      accountSyncedOnce = stateLog.engine.backgroundState.SyncController.hasAccountSyncingSyncedAtLeastOnce;
    }

    // Check for submitted time
    let submittedTime: VariableValue = getVariableValue('submittedTime');
    // If not found, check AppStateController lastActiveTime or user activity timestamps
    if (submittedTime === 'Not available') {
      if (stateLog.engine?.backgroundState?.AppStateController?.lastActiveTime) {
        submittedTime = stateLog.engine.backgroundState.AppStateController.lastActiveTime;
      } else if (stateLog.engine?.backgroundState?.PreferencesController?.lastUserActivityTime) {
        submittedTime = stateLog.engine.backgroundState.PreferencesController.lastUserActivityTime;
      }
    }

    return [
      {
        id: 'submittedTime',
        label: 'Submitted Time',
        value: formatValue(submittedTime)
      },
      {
        id: 'seedphraseBackedUp',
        label: 'Seedphrase Backed Up',
        value: formatValue(seedphraseBackedUp)
      },
      {
        id: 'automaticSecurityChecksEnabled',
        label: 'Automatic Security Checks Enabled',
        value: formatValue(automaticSecurityChecks)
      },
      {
        id: 'securityAlertsEnabled',
        label: 'Security Alerts Enabled',
        value: formatValue(securityAlerts)
      },
      {
        id: 'isProfileSyncingEnabled',
        label: 'Profile Syncing Enabled',
        value: formatValue(profileSyncing)
      },
      {
        id: 'isProfileSyncingUpdateLoading',
        label: 'Profile Syncing Update Loading',
        value: formatValue(profileSyncingUpdate)
      },
      {
        id: 'hasAccountSyncingSyncedAtLeastOnce',
        label: 'Account Syncing Has Synced At Least Once',
        value: formatValue(accountSyncedOnce)
      },
      {
        id: 'version',
        label: 'MetaMask Version',
        value: formatValue(versionValue)
      },
      {
        id: 'isMobileApp',
        label: 'App Type',
        value: isMobileApp ? 'Mobile App' : 'Browser Extension'
      }
    ];
  }, [stateLog]);

  if (!stateLog) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>State Log Variables</CardTitle>
          <CardDescription>No state log data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">State Log Variables</CardTitle>
        <CardDescription>
          Important variables from the state log
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {variables.map((variable) => (
              <Card key={variable.id} className="border-muted">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg font-medium">{variable.label}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm">{variable.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-muted">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg font-medium">Raw State Log</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="raw-log">
                  <AccordionTrigger>View Raw Log Data</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-96">
                      {JSON.stringify(stateLog, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
