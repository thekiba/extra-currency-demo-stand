import { formatTON, formatEC } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface AmountProps {
  amount: bigint | null;
  showSuffix?: boolean;
  className?: string;
}

/**
 * Format TON amount as a React component
 */
export function TONAmount({ amount, showSuffix = true, className }: AmountProps) {
  return (
    <span className={cn("font-medium tabular-nums", className)}>
      {formatTON(amount, showSuffix)}
    </span>
  );
}

/**
 * Format EC amount as a React component
 */
export function ECAmount({ amount, showSuffix = true, className }: AmountProps) {
  return (
    <span className={cn("font-medium tabular-nums", className)}>
      {formatEC(amount, showSuffix)}
    </span>
  );
} 