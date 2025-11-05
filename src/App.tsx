import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/file-uploader";
import { MainLayout } from "@/components/layout/main-layout";
import type { MetaMaskStateLog } from "@/types/state-log";
import {
  TransactionList,
  OriginsList,
  ApprovalsList,
  AccountsList,
  VariableViewer,
  MobileInfo
} from "@/components/state-log-viewers";

export default function App() {
  const [stateLog, setStateLog] = useState<MetaMaskStateLog | null>(null);

  const handleFileLoaded = (data: MetaMaskStateLog) => {
    setStateLog(data);
  };

  return (
    <MainLayout>
      {!stateLog ? (
        <div className="flex flex-col items-center max-w-2xl mx-auto gap-8">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>MetaMask State Log Explorer</CardTitle>
              <CardDescription>
                Upload your MetaMask state log (.json or .txt) to analyze transaction origins and detect potentially malicious approvals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader onFileLoaded={handleFileLoaded} className="mt-4" />
            </CardContent>
          </Card>

          <div className="w-full space-y-4">
            <h2 className="text-xl font-semibold">How to Get MetaMask State Logs</h2>
            <Card>
              <CardHeader>
                <CardTitle>From MetaMask Extension</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Open MetaMask by clicking the extension icon</li>
                  <li>Click the account icon in the top-right corner</li>
                  <li>Select "Settings" from the dropdown menu</li>
                  <li>Go to the "Advanced" tab</li>
                  <li>Scroll down and click "Download State Logs"</li>
                  <li>Save the file to your computer</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>From MetaMask Mobile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Open the MetaMask mobile app</li>
                  <li>Tap the menu icon in the top-left corner</li>
                  <li>Tap "Settings"</li>
                  <li>Tap "Advanced"</li>
                  <li>Tap "View State Logs"</li>
                  <li>Use the Share button to save or send the logs</li>
                </ol>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700">
                    <strong>iPhone users:</strong> State logs may download as .txt files.
                    This app automatically converts them to the correct format - just upload the .txt file directly!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">State Log Analysis</h1>
            <button
              onClick={() => setStateLog(null)}
              className="text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Upload a different file
            </button>
          </div>

          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid grid-cols-6 max-w-4xl">
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="origins">Origins</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
              <TabsTrigger value="mobile">Mobile Info</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions">
              <TransactionList stateLog={stateLog} />
            </TabsContent>
            <TabsContent value="origins">
              <OriginsList stateLog={stateLog} />
            </TabsContent>
            <TabsContent value="approvals">
              <ApprovalsList stateLog={stateLog} />
            </TabsContent>
            <TabsContent value="accounts">
              <AccountsList stateLog={stateLog} />
            </TabsContent>
            <TabsContent value="variables">
              <VariableViewer stateLog={stateLog} />
            </TabsContent>
            <TabsContent value="mobile">
              <MobileInfo stateLog={stateLog} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </MainLayout>
  );
}
