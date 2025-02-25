import { TestGroup } from "@/types/test-case";

export const initialTestGroups: TestGroup[] = [
  {
    id: "emulation-settings",
    title: "Emulation Settings",
    description: "Configure wallet emulation preferences",
    cases: [
      {
        id: "emulation-support",
        title: "Emulation Support",
        description: "Does your wallet support emulation?",
        type: "prompt",
        status: "pending",
        isOptional: true,
      },
    ],
  },
  {
    id: "wallet-connection",
    title: "Wallet Connection",
    description: "Basic wallet connection and feature verification",
    cases: [
      {
        id: "connect-wallet",
        title: "Connect Wallet",
        description: "Click on Connect Wallet button to connect your wallet",
        type: "check",
        status: "pending",
        retryable: true,
      },
      {
        id: "ec-support",
        title: "Extra Currency Support",
        description:
          "Checking if wallet indicates Extra Currency support in its features",
        type: "check",
        status: "pending",
        dependencies: ["connect-wallet"],
      },
    ],
  },
  {
    id: "ec-topup",
    title: "Extra Currency Top Up",
    description: "Getting test Extra Currency",
    cases: [
      {
        id: "ton-balance",
        title: "TON Balance Check",
        description: "Checking if wallet has at least 3.25 test TON",
        type: "check",
        status: "pending",
        retryable: true,
        dependencies: ["connect-wallet"],
      },
      {
        id: "get-test-ec",
        title: "Get Test EC",
        description: "Sending TON to get test Extra Currency",
        type: "check",
        status: "pending",
        retryable: true,
        dependencies: ["ton-balance", "ec-support"],
      },
      {
        id: "emulation-display",
        title: "Emulation Display",
        description:
          "Wallet emulation displayed incoming EC and TON excess correctly",
        type: "prompt",
        status: "pending",
        isEmulationRequired: true,
        dependencies: ["get-test-ec", "emulation-support"],
      },
    ],
  },
  {
    id: "balance-verification",
    title: "Balance Verification",
    description: "Verifying EC balance display",
    cases: [
      {
        id: "ec-balance-check",
        title: "EC Balance Check",
        description: "Checking if wallet has Extra Currency",
        type: "check",
        status: "pending",
        retryable: true,
        dependencies: ["connect-wallet"],
      },
      {
        id: "ec-balance-verification",
        title: "Balance Display",
        description: "Verify that your wallet displays the correct EC balance",
        type: "prompt",
        status: "pending",
        dependencies: ["ec-balance-check"],
      },
    ],
  },
  {
    id: "send-ec-ton-connect",
    title: "Send EC via TON Connect",
    description: "Testing EC transfer via TON Connect",
    cases: [
      {
        id: "send-ec-ton-connect",
        title: "Send via TON Connect",
        description: "Sending EC back to swap contract via TON Connect",
        type: "check",
        status: "pending",
        retryable: true,
        dependencies: ["ec-balance-check", "ec-support"],
      },
      {
        id: "emulation-display-send",
        title: "Emulation Send Display",
        description: "Wallet emulation displayed outgoing EC correctly",
        type: "prompt",
        status: "pending",
        isEmulationRequired: true,
        dependencies: ["send-ec-ton-connect", "emulation-support"],
      },
    ],
  },
  {
    id: "send-ec-native",
    title: "Send EC via Wallet Interface",
    description: "Testing EC transfer via wallet interface",
    cases: [
      {
        id: "send-ec-native",
        title: "Send via Wallet Interface",
        description: "Send EC to the swap contract using wallet interface",
        type: "prompt",
        status: "pending",
        retryable: true,
        dependencies: ["ec-balance-check"],
      },
      {
        id: "emulation-display-native-send",
        title: "Emulation Send Display",
        description: "Wallet emulation displayed outgoing EC correctly",
        type: "prompt",
        status: "pending",
        isEmulationRequired: true,
        dependencies: ["send-ec-native", "emulation-support"],
      },
    ],
  },
];
