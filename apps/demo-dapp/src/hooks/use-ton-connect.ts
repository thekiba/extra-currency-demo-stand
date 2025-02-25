import {
  toUserFriendlyAddress,
  useTonAddress,
  useTonConnectUI,
  CHAIN,
} from "@tonconnect/ui-react";
import { useCallback, useMemo } from "react";

/**
 * Interface for describing supported wallet functions
 */
export interface WalletFeatures {
  /** Wallet connection status */
  isConnected: boolean;
  /** User address in user-friendly format */
  userAddress: string;
  /** Extra Currency support in wallet */
  hasExtraCurrencySupport: boolean;
}

/**
 * Interface for transaction sending function with Extra Currency support
 */
interface SendTransactionFeature {
  /** Function name */
  name: "SendTransaction";
  /** Maximum number of messages */
  maxMessages: number;
  /** Extra Currency support flag */
  extraCurrencySupported?: boolean;
}

/**
 * Hook for working with TON Connect
 * Provides functions for wallet connection and checking Extra Currency support
 *
 * @returns Object with functions and properties for interacting with the wallet
 */
export function useTonConnect() {
  const [tonConnectUI] = useTonConnectUI();
  const userAddress = useTonAddress();

  /**
   * Checks capabilities of the connected wallet
   * @returns Object with information about supported wallet functions
   */
  const checkWalletFeatures = useCallback((): WalletFeatures => {
    const wallet = tonConnectUI.wallet;

    if (!wallet) {
      return {
        isConnected: false,
        userAddress: "",
        hasExtraCurrencySupport: false,
      };
    }

    const userFriendlyAddress = toUserFriendlyAddress(
      wallet.account.address,
      wallet.account.chain === CHAIN.TESTNET
    );

    // Check for SendTransaction function with extraCurrencySupported support
    const sendTransactionFeature = wallet.device.features.find(
      (feature): feature is SendTransactionFeature =>
        typeof feature === "object" &&
        feature !== null &&
        "name" in feature &&
        feature.name === "SendTransaction"
    );

    return {
      isConnected: true,
      userAddress: userFriendlyAddress,
      hasExtraCurrencySupport: Boolean(
        sendTransactionFeature?.extraCurrencySupported
      ),
    };
  }, [tonConnectUI.wallet]);

  /**
   * Opens wallet connection modal window
   */
  const connect = useCallback(() => {
    tonConnectUI.openModal();
  }, [tonConnectUI]);

  /**
   * Disconnects the wallet
   */
  const disconnect = useCallback(() => {
    tonConnectUI.disconnect();
  }, [tonConnectUI]);

  /**
   * Wallet object with memoization
   */
  const wallet = useMemo(() => {
    return tonConnectUI.wallet;
  }, [tonConnectUI.wallet?.account]);

  /**
   * Flag indicating successful wallet connection
   */
  const isConnected = useMemo(() => {
    return !!(wallet && userAddress);
  }, [wallet, userAddress]);

  /**
   * Flag for Extra Currency support in wallet
   */
  const hasExtraCurrencySupport = useMemo(() => {
    if (!wallet) return false;

    return wallet?.device.features.some(
      (feature): feature is SendTransactionFeature =>
        typeof feature === "object" &&
        feature !== null &&
        "name" in feature &&
        feature.name === "SendTransaction" &&
        "extraCurrencySupported" in feature &&
        typeof feature.extraCurrencySupported === "boolean"
    );
  }, [wallet]);

  return {
    connect,
    disconnect,
    wallet,
    userAddress,
    isConnected,
    hasExtraCurrencySupport,
    checkWalletFeatures,
  };
}
