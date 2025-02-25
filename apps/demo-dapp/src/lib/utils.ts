import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { fromNano } from "@ton/ton";
import { EC_DECIMALS } from "@/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format TON amount with proper formatting and optional currency suffix
 * @param amount TON amount in nanoTON as bigint or null
 * @param showSuffix Whether to show "TON" suffix after the amount
 * @returns Formatted TON amount string
 */
export function formatTON(amount: bigint | null, showSuffix = true): string {
  const safeAmount = amount || 0n;
  const formattedAmount = fromNano(safeAmount);

  return `${formattedAmount}${showSuffix ? " TON" : ""}`;
}

/**
 * Format EC amount with proper formatting and optional currency suffix
 * @param amount EC amount in nanoEC as bigint or null
 * @param showSuffix Whether to show "EC" suffix after the amount
 * @returns Formatted EC amount string
 */
export function formatEC(amount: bigint | null, showSuffix = true): string {
  const safeAmount = amount || 0n;
  // Convert EC to nano format (EC has 8 decimals, TON has 9)
  const scaledAmount = safeAmount * 10n ** (9n - BigInt(EC_DECIMALS));
  const formattedAmount = fromNano(scaledAmount);

  return `${formattedAmount}${showSuffix ? " EC" : ""}`;
}
