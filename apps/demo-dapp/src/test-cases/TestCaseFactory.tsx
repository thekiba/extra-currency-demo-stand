import { TestCase, TestStatus } from "@/types/test-case";
import { ConnectWalletTest } from "./ConnectWalletTest";
import { ExtraCurrencySupportTest } from "./ExtraCurrencySupportTest";
import { EmulationSupportTest } from "./EmulationSupportTest";
import { TonBalanceTest } from "./TonBalanceTest";
import { GetTestEcTest } from "./GetTestEcTest";
import { EmulationDisplayTest } from "./EmulationDisplayTest";
import { EcBalanceCheckTest } from "./EcBalanceCheckTest";
import { EcBalanceVerificationTest } from "./EcBalanceVerificationTest";
import { SendEcViaTonConnectTest } from "./SendEcViaTonConnectTest";
import { SendEcViaNativeTest } from "./SendEcViaNativeTest";
import { EmulationDisplaySendTest } from "./EmulationDisplaySendTest";
import { EmulationDisplayNativeSendTest } from "./EmulationDisplayNativeSendTest";
import { MockTestCase } from "./MockTestCase";
import { useCallback } from "react";

/**
 * Test case identifiers used to map to their respective component implementations
 */
const TEST_ID = {
  CONNECT_WALLET: 'connect-wallet',
  EC_SUPPORT: 'ec-support',
  EMULATION_SUPPORT: 'emulation-support',
  TON_BALANCE: 'ton-balance',
  GET_TEST_EC: 'get-test-ec',
  EMULATION_DISPLAY: 'emulation-display',
  EC_BALANCE_CHECK: 'ec-balance-check',
  EC_BALANCE_VERIFICATION: 'ec-balance-verification',
  SEND_EC_TON_CONNECT: 'send-ec-ton-connect',
  SEND_EC_NATIVE: 'send-ec-native',
  EMULATION_DISPLAY_SEND: 'emulation-display-send',
  EMULATION_DISPLAY_NATIVE_SEND: 'emulation-display-native-send'
} as const;

/**
 * Type definition for the test case ID values
 */
type TestCaseId = typeof TEST_ID[keyof typeof TEST_ID];

/**
 * Props for the TestCaseFactory component
 */
interface TestCaseFactoryProps {
  /** The test case configuration */
  testCase: TestCase;
  /** Unique identifier for the test */
  testId: string;
  /** Whether the test is locked/disabled */
  isLocked?: boolean;
  /** Callback for when test status changes */
  onStatusChange?: (testId: string, status: TestStatus) => void;
}

/**
 * Props passed to individual test components
 */
interface TestCaseProps {
  /** The test case configuration */
  testCase: TestCase;
  /** Whether the test is locked/disabled */
  isLocked?: boolean;
  /** Callback for when test status changes */
  onStatusChange?: (status: TestStatus) => void;
}

/**
 * Factory component that renders the appropriate test component based on test ID
 * 
 * This component serves as a router for different test implementations
 * and provides a consistent way to handle status changes across all tests.
 */
export function TestCaseFactory({ testCase, onStatusChange, testId, ...props }: TestCaseFactoryProps) {
  // Map test case IDs to their respective components
  const testComponents: Record<TestCaseId, React.ComponentType<TestCaseProps>> = {
    [TEST_ID.CONNECT_WALLET]: ConnectWalletTest,
    [TEST_ID.EC_SUPPORT]: ExtraCurrencySupportTest,
    [TEST_ID.EMULATION_SUPPORT]: EmulationSupportTest,
    [TEST_ID.TON_BALANCE]: TonBalanceTest,
    [TEST_ID.GET_TEST_EC]: GetTestEcTest,
    [TEST_ID.EMULATION_DISPLAY]: EmulationDisplayTest,
    [TEST_ID.EC_BALANCE_CHECK]: EcBalanceCheckTest,
    [TEST_ID.EC_BALANCE_VERIFICATION]: EcBalanceVerificationTest,
    [TEST_ID.SEND_EC_TON_CONNECT]: SendEcViaTonConnectTest,
    [TEST_ID.SEND_EC_NATIVE]: SendEcViaNativeTest,
    [TEST_ID.EMULATION_DISPLAY_SEND]: EmulationDisplaySendTest,
    [TEST_ID.EMULATION_DISPLAY_NATIVE_SEND]: EmulationDisplayNativeSendTest,
  };

  /**
   * Wraps the onStatusChange callback to include the test ID
   * This allows child components to update the status without knowing their test ID
   */
  const handleStatusChange = useCallback((status: TestStatus) => {
    onStatusChange?.(testId, status);
  }, [testId, onStatusChange]);

  // Get the appropriate test component or fallback to MockTestCase if not found
  const TestComponent = (testCase.id in testComponents) 
    ? testComponents[testCase.id as TestCaseId] 
    : MockTestCase;
  
  return (
    <TestComponent 
      testCase={testCase} 
      onStatusChange={handleStatusChange} 
      {...props} 
    />
  );
} 