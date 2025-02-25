import { BaseTestCase, BaseTestCaseProps } from "./BaseTestCase";
import { useTonConnect } from "@/hooks/use-ton-connect";
import { useEffect, useState, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { Address } from "@ton/ton";
import { getAccountState } from "@/lib/ton-client";
import { TestStepsList } from "@/components/test-steps/TestStepsList";
import { useTestSteps } from "@/hooks/use-test-steps";
import { TestStep } from "@/types/test-steps";
import { AccountLink } from "@/components/ton/links";
import { ECAmount } from "@/components/ton";
import { EC_DECIMALS } from "@/constants";

/**
 * Constants for EC token configuration
 */
const EC_TOKEN_ID = 100;
const MIN_REQUIRED_BALANCE = BigInt(0.01 * 10 ** EC_DECIMALS); // Minimum sent amount for test

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
    title: 'EC Balance Check',
    description: 'Checking if your wallet has enough Extra Currency for testing',
    type: 'auto-check',
    status: 'pending'
  }
];

/**
 * Component for testing if a wallet has enough Extra Currency for further tests
 */
export function EcBalanceCheckTest(props: BaseTestCaseProps) {
  const { userAddress } = useTonConnect();
  const [ecBalance, setEcBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { 
    steps, 
    updateStepDetails,
    setStepSuccess,
    setStepFailure,
    setStepRunning,
    setAllStepsStatus
  } = useTestSteps({
    defaultSteps: DEFAULT_STEPS,
    testStatus: props.testCase.status
  });

  /**
   * Checks the user's Extra Currency balance and updates the test status
   * Updates test step status based on the balance result
   */
  const checkEcBalance = async () => {
    if (!userAddress) return;

    setIsLoading(true);
    setStepRunning(STEP_ID.CHECK_BALANCE);
    
    try {
      const account = await getAccountState(Address.parse(userAddress));
      const currentBalance = BigInt(account.account.balance.currencies[EC_TOKEN_ID] || 0n);
      setEcBalance(currentBalance);

      const hasEnoughBalance = currentBalance >= MIN_REQUIRED_BALANCE;
      
      if (hasEnoughBalance) {
        setStepSuccess(STEP_ID.CHECK_BALANCE);
        props.onStatusChange?.('success');
      } else {
        setStepFailure(STEP_ID.CHECK_BALANCE);
        props.onStatusChange?.('failure');
      }
    } catch (error) {
      console.error('Failed to fetch EC balance:', error);
      setStepFailure(STEP_ID.CHECK_BALANCE);
      props.onStatusChange?.('failure');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize test and check balance when wallet is connected
   */
  useEffect(() => {
    if (!userAddress) {
      setAllStepsStatus('pending');
      props.onStatusChange?.('pending');
      return;
    }

    if (props.testCase.status === 'pending') {
      checkEcBalance();
    }
  }, [userAddress, props.testCase.status]);

  /**
   * Renders success message when user has enough EC balance
   */
  const renderSuccessMessage = (): ReactNode => (
    <div className="text-sm text-green-600">
      ✓ Your wallet has enough Extra Currency
    </div>
  );

  /**
   * Renders error message when user doesn't have enough EC balance
   */
  const renderInsufficientBalanceMessage = (): ReactNode => (
    <Alert variant="destructive" className="mt-2">
      <AlertDescription className="space-y-2">
        <p>Not enough Extra Currency:</p>
        <div className="mt-2 text-sm bg-red-500/10 p-4 rounded space-y-2">
          <ul className="list-disc pl-4 space-y-1">
            <li>Your balance: <ECAmount amount={ecBalance} /></li>
            <li>Minimum needed: <ECAmount amount={MIN_REQUIRED_BALANCE} /></li>
            <li>Complete the "Get Test EC" step to get test tokens</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );

  /**
   * Renders balance details and status information
   */
  const renderBalanceDetails = (): ReactNode => {
    const hasEnoughBalance = ecBalance !== null && ecBalance >= MIN_REQUIRED_BALANCE;
    
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm space-y-1">
          <div>Current balance: <ECAmount amount={ecBalance} /></div>
          <div>Connected address: <AccountLink address={userAddress || ''} /></div>
        </div>
        {hasEnoughBalance ? renderSuccessMessage() : renderInsufficientBalanceMessage()}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={checkEcBalance}
            disabled={isLoading}
            className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600"
          >
            <RotateCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Balance
          </Button>
        </div>
      </div>
    );
  };

  /**
   * Renders the content for the balance check step
   */
  const renderBalanceCheckContent = (): ReactNode => {
    return (
      <div className="flex flex-col gap-4">
        <Alert>
          <AlertDescription className="space-y-2">
            <p>Checking your Extra Currency balance:</p>
            <ul className="list-disc pl-4 space-y-1 text-sm">
              <li>Minimum required: <ECAmount amount={MIN_REQUIRED_BALANCE} /></li>
              <li>This balance is required to run test operations</li>
            </ul>
          </AlertDescription>
        </Alert>
        {ecBalance !== null && renderBalanceDetails()}
      </div>
    );
  };

  /**
   * Update step UI based on current balance state
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