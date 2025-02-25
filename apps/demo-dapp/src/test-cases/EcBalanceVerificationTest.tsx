import { BaseTestCase, BaseTestCaseProps } from "./BaseTestCase";
import { Button } from "@/components/ui/button";
import { Check, X, RotateCw } from "lucide-react";
import { useTonConnect } from "@/hooks/use-ton-connect";
import { useEffect, useState, useRef, ReactNode } from "react";
import { getAccountState } from "@/lib/ton-client";
import { Address } from "@ton/ton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TestStepsList } from "@/components/test-steps/TestStepsList";
import { useTestSteps } from "@/hooks/use-test-steps";
import { TestStep } from "@/types/test-steps";
import { AccountLink } from "@/components/ton/links";
import { ECAmount } from "@/components/ton";
import { EC_TOKEN_ID } from "@/constants";

/**
 * Constants for Extra Currency token configuration
 */
const UPDATE_INTERVAL = 5000; // 5 seconds interval for balance checks

/**
 * Step identifiers used throughout the component
 */
const STEP_ID = {
  CHECK_BALANCE: 'check-balance'
} as const;

/**
 * Default test steps configuration
 */
const DEFAULT_STEPS: TestStep[] = [
  {
    id: STEP_ID.CHECK_BALANCE,
    title: 'Balance Display',
    description: 'Verify that your wallet displays the correct EC balance',
    type: 'user-action',
    status: 'pending'
  }
];

/**
 * Test component for verifying if a wallet correctly displays Extra Currency balance
 */
export function EcBalanceVerificationTest(props: BaseTestCaseProps) {
  const { userAddress } = useTonConnect();
  const [ecBalance, setEcBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    steps, 
    updateStepDetails,
    setStepSuccess,
    setStepFailure,
  } = useTestSteps({
    defaultSteps: DEFAULT_STEPS,
    testStatus: props.testCase.status
  });

  /**
   * Fetches the current EC balance for the connected wallet
   */
  const fetchEcBalance = async () => {
    if (!userAddress || props.testCase.status !== 'pending') return;

    setIsLoading(true);
    try {
      const account = await getAccountState(Address.parse(userAddress));
      const balance = BigInt(account.account.balance.currencies[EC_TOKEN_ID] || 0n);
      setEcBalance(balance);
    } catch (error) {
      console.error('Failed to fetch EC balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user response to balance verification question
   * @param isCorrect Whether the user confirms the balance is correctly displayed
   */
  const handleUserResponse = (isCorrect: boolean) => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
    }
    
    if (isCorrect) {
      setStepSuccess(STEP_ID.CHECK_BALANCE);
    } else {
      setStepFailure(STEP_ID.CHECK_BALANCE);
    }
    
    props.onStatusChange?.(isCorrect ? 'success' : 'failure');
  };

  /**
   * Renders the current balance information section
   */
  const renderBalanceInfo = (): ReactNode => {
    if (ecBalance === null) return null;
    
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm">
          Expected balance: <ECAmount amount={ecBalance} />
        </div>
        <div className="text-sm">
          Connected address: <AccountLink address={userAddress || ''} />
        </div>
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEcBalance}
            disabled={isLoading}
            className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600"
          >
            <RotateCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Renders the success state content
   */
  const renderSuccessContent = (): ReactNode => {
    if (props.testCase.status !== 'success') return null;
    
    return (
      <div className="text-sm text-green-600">
        ✓ Wallet displays correct EC balance
      </div>
    );
  };

  /**
   * Renders the failure state content
   */
  const renderFailureContent = (): ReactNode => {
    if (props.testCase.status !== 'failure') return null;
    
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertDescription className="flex flex-col gap-2">
          <div>
            Balance display issues:
            <div className="mt-2 text-sm bg-red-500/10 p-2 rounded">
              Wallet does not display the correct EC balance. Please make sure:
              <ul className="list-disc list-inside mt-2">
                <li>You are looking at Extra Currency balance (not TON)</li>
                <li>The balance matches the amount shown above</li>
                <li>Your wallet supports displaying EC balances</li>
              </ul>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  /**
   * Renders the user response buttons
   */
  const renderResponseButtons = (): ReactNode => {
    if (props.testCase.status !== 'pending') return null;
    
    return (
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUserResponse(true)}
          className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600"
        >
          <Check className="w-4 h-4 mr-2" />
          Yes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUserResponse(false)}
          className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600"
        >
          <X className="w-4 h-4 mr-2" />
          No
        </Button>
      </div>
    );
  };

  /**
   * Renders the complete content for the balance check step
   */
  const renderBalanceCheckContent = (): ReactNode => {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <AlertDescription>
            Please verify that your wallet displays the correct EC balance:
            <ul className="list-disc list-inside mt-2">
              <li>Open your wallet</li>
              <li>Find Extra Currency balance</li>
              <li>Compare it with the balance shown below</li>
            </ul>
          </AlertDescription>
        </Alert>
        {renderBalanceInfo()}
        {renderSuccessContent()}
        {renderFailureContent()}
        {renderResponseButtons()}
      </div>
    );
  };

  /**
   * Sets up balance checking interval and handles cleanup
   */
  useEffect(() => {
    // Initial balance check
    fetchEcBalance();

    // Set up interval for balance checking if test is pending
    if (props.testCase.status === 'pending') {
      updateIntervalRef.current = setInterval(fetchEcBalance, UPDATE_INTERVAL);
    }

    // Cleanup interval on unmount or status change
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [userAddress, props.testCase.status]);

  /**
   * Updates step content when relevant state changes
   */
  useEffect(() => {
    updateStepDetails(STEP_ID.CHECK_BALANCE, renderBalanceCheckContent());
  }, [props.testCase.status, ecBalance, userAddress, isLoading]);

  return (
    <BaseTestCase {...props}>
      <div className="flex flex-col">
        <TestStepsList steps={steps} />
      </div>
    </BaseTestCase>
  );
} 