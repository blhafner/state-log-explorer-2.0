import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  if (!timestamp) return "Unknown";

  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function truncateAddress(address: string | undefined, length = 6): string {
  if (!address) return "Unknown";
  if (address.length <= length * 2 + 2) return address;

  return `${address.substring(0, length)}...${address.substring(address.length - length)}`;
}

export function formatEther(wei: string): string {
  try {
    // Convert from wei to ether (1 ether = 10^18 wei)
    const etherValue = BigInt(wei) / BigInt(10 ** 18);
    const etherString = etherValue.toString();

    // Check if it's a whole number
    if (etherString.includes(".")) {
      // Limit to 6 decimal places for readability
      const parts = etherString.split(".");
      return `${parts[0]}.${parts[1].substring(0, Math.min(parts[1].length, 6))}`;
    }

    return etherString;
  } catch (error) {
    console.error("Error formatting ether value:", error);
    return "0";
  }
}

export function isEthereumAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function getFirstAccountAddress(accounts: Record<string, string>): string {
  const addresses = Object.keys(accounts);
  return addresses.length > 0 ? addresses[0] : '';
}

export function getBlockExplorerUrl(txHash: string, chainId?: string): string {
  // Default to Ethereum Mainnet (chainId 1)
  const explorerBaseUrl = getExplorerBaseUrl(chainId || "1");
  return `${explorerBaseUrl}/tx/${txHash}`;
}

export function getAddressExplorerUrl(address: string, chainId?: string): string {
  // Default to Ethereum Mainnet (chainId 1)
  const explorerBaseUrl = getExplorerBaseUrl(chainId || "1");
  return `${explorerBaseUrl}/address/${address}`;
}

export function getExplorerBaseUrl(chainId: string): string {
  // Map of chainId to block explorer base URL
  const explorers: Record<string, string> = {
    "1": "https://etherscan.io",
    "3": "https://ropsten.etherscan.io",
    "4": "https://rinkeby.etherscan.io",
    "5": "https://goerli.etherscan.io",
    "42": "https://kovan.etherscan.io",
    "56": "https://bscscan.com",
    "97": "https://testnet.bscscan.com",
    "137": "https://polygonscan.com",
    "80001": "https://mumbai.polygonscan.com",
    "42161": "https://arbiscan.io",
    "421611": "https://testnet.arbiscan.io",
    "10": "https://optimistic.etherscan.io",
    "69": "https://kovan-optimistic.etherscan.io",
    "43114": "https://snowtrace.io",
    "43113": "https://testnet.snowtrace.io",
    "250": "https://ftmscan.com",
    "4002": "https://testnet.ftmscan.com",
    "100": "https://gnosisscan.io",
    "11155111": "https://sepolia.etherscan.io"
  };

  return explorers[chainId] || "https://etherscan.io";
}
