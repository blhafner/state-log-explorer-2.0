import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon } from "lucide-react";
import type { MetaMaskStateLog } from "@/types/state-log";
import { parseTextStateLog, getFileParsingStrategy, validateStateLog } from "@/utils/txt-parser";

interface FileUploaderProps {
  onFileLoaded: (data: MetaMaskStateLog) => void;
  className?: string;
}

export function FileUploader({ onFileLoaded, className = "" }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      setIsProcessing(true);
      const file = acceptedFiles[0];
      if (!file) {
        setIsProcessing(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const fileContent = event.target?.result as string;
          const parsingStrategy = getFileParsingStrategy(file.name, fileContent);

          let jsonData: MetaMaskStateLog;

          switch (parsingStrategy) {
            case 'json':
              // Standard JSON parsing
              jsonData = JSON.parse(fileContent);
              break;

            case 'txt':
              // Parse as text file (iPhone format)
              console.log('Detected iPhone .txt format, attempting to parse...');
              jsonData = parseTextStateLog(fileContent);
              console.log('Successfully parsed .txt file as JSON');
              break;

            default:
              throw new Error(
                'Unsupported file format. Please upload a valid MetaMask state log file (.json or .txt).'
              );
          }

          // Validate that the parsed data looks like a MetaMask state log
          if (!validateStateLog(jsonData)) {
            throw new Error(
              'The file was parsed successfully but does not appear to be a valid MetaMask state log. ' +
              'Please ensure you are uploading the correct file.'
            );
          }

          // Debug log to see the structure
          console.log("Parsed file structure:", {
            fileName: file.name,
            fileType: file.type,
            parsingStrategy,
            hasMetamask: !!jsonData.metamask,
            transactions: jsonData.metamask?.transactions ?
              `Found ${Array.isArray(jsonData.metamask.transactions) ? jsonData.metamask.transactions.length : 'object'} transactions` :
              'No transactions property',
            transactionHistory: jsonData.metamask?.transactionHistory ?
              `Found transaction history with ${Object.keys(jsonData.metamask.transactionHistory || {}).length} entries` :
              'No transaction history',
            pendingApprovals: jsonData.metamask?.pendingApprovals ?
              `Found pending approvals with ${Object.keys(jsonData.metamask.pendingApprovals || {}).length} entries` :
              'No pending approvals',
            // Check for mobile structure
            hasMobileEngine: !!jsonData.engine?.backgroundState,
            mobileTransactions: jsonData.engine?.backgroundState?.TransactionController?.transactions ?
              `Found mobile transactions with ${Array.isArray(jsonData.engine.backgroundState.TransactionController.transactions)
                ? jsonData.engine.backgroundState.TransactionController.transactions.length
                : Object.keys(jsonData.engine.backgroundState.TransactionController.transactions).length} entries` :
              'No mobile transactions found',
            mobileAccounts: jsonData.engine?.backgroundState?.AccountTrackerController?.accounts ?
              `Found ${Object.keys(jsonData.engine.backgroundState.AccountTrackerController.accounts).length} mobile accounts` :
              'No mobile accounts found',
            data: jsonData
          });

          onFileLoaded(jsonData);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          setError(`Error parsing file: ${errorMessage}`);
          console.error("Error parsing file:", err);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setError("Error reading file. Please try again.");
        setIsProcessing(false);
      };
      reader.readAsText(file);
    },
    [onFileLoaded]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => {
      setIsDragging(false);
      setError("Please upload a valid file (.json or .txt).");
    },
  });

  return (
    <div className={className}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          <UploadIcon className="h-10 w-10 text-muted-foreground/70" />
          <h3 className="text-lg font-medium">
            {isProcessing ? "Processing file..." : "Drop a state log file here"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isProcessing
              ? "Parsing and converting file format..."
              : "Supports .json and .txt files (iPhone downloads) - Or click to browse"
            }
          </p>
        </div>
      </div>
      {error && (
        <div className="mt-2 p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
          <strong>Error:</strong> {error}
          <br />
          <span className="text-xs mt-1 text-red-400">
            Tip: iPhone users can download state logs as .txt files - they will be automatically converted.
          </span>
        </div>
      )}
    </div>
  );
}
