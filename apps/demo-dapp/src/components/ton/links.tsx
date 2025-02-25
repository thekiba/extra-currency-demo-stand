import { ExternalLink } from "lucide-react";

const EXPLORER_BASE = 'https://testnet.tonviewer.com';

interface TonEntityLinkProps {
  address: string;
  className?: string;
  short?: boolean;
}

interface TonTxLinkProps {
  hash: string;
  className?: string;
}

const formatAddress = (address: string, short = true) => {
  if (!address) return '';
  return short ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;
};

export function AccountLink({ address, className, short = true }: TonEntityLinkProps) {
  if (!address) return null;
  
  return (
    <a
      href={`${EXPLORER_BASE}/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className || "text-blue-500 hover:text-blue-600 inline-flex items-center gap-1"}
    >
      {formatAddress(address, short)}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export function ContractLink({ address, className, short = true }: TonEntityLinkProps) {
  if (!address) return null;

  return (
    <a
      href={`${EXPLORER_BASE}/${address}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className || "text-purple-500 hover:text-purple-600 inline-flex items-center gap-1"}
    >
      {formatAddress(address, short)}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export function TransactionLink({ hash, className }: TonTxLinkProps) {
  if (!hash) return null;

  return (
    <a
      href={`${EXPLORER_BASE}/transaction/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className || "text-green-500 hover:text-green-600 inline-flex items-center gap-1"}
    >
      View Transaction
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

export function AddressLabel({ label, address, className, short = true }: TonEntityLinkProps & { label: string }) {
  if (!address) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-gray-600">{label}:</span>
      <AccountLink address={address} className={className} short={short} />
    </div>
  );
}

export function ContractLabel({ label, address, className, short = true }: TonEntityLinkProps & { label: string }) {
  if (!address) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-gray-600">{label}:</span>
      <ContractLink address={address} className={className} short={short} />
    </div>
  );
} 