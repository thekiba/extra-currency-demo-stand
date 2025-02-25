import { BaseTestCase, BaseTestCaseProps } from "./BaseTestCase";
import { useTonConnect } from "@/hooks/use-ton-connect";
import { useEffect, useState, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { Address, toNano } from "@ton/ton";
import { getAccountState } from "@/lib/ton-client";
import { TestStepsList } from "@/components/test-steps/TestStepsList";
import { useTestSteps } from "@/hooks/use-test-steps";
import { TestStep } from "@/types/test-steps";
import { AccountLink } from "@/components/ton/links";
import { TONAmount } from "@/components/ton";

/**
 * Minimum TON required for testing (in whole TON)
 */
const REQUIRED_BALANCE = toNano(3.25);

/**
 * Step identifiers used throughout the component
 */
const STEP_ID = {
  CHECK_BALANCE: 'check-balance'
} as const;

/**
 * Default test steps for TON balance verification
 */
const DEFAULT_STEPS: TestStep[] = [
  {
    id: STEP_ID.CHECK_BALANCE,
    title: 'TON Balance Check',
    description: 'Checking if your wallet has enough TON for testing',
    type: 'auto-check',
    status: 'pending'
  }
];

/**
 * Component for testing whether the connected wallet has sufficient TON balance
 */
export function TonBalanceTest(props: BaseTestCaseProps) {
  const { userAddress } = useTonConnect();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    steps, 
    updateStepDetails,
    setStepSuccess,
    setStepFailure,
    setStepPending,
    setStepRunning
  } = useTestSteps({
    defaultSteps: DEFAULT_STEPS,
    testStatus: props.testCase.status
  });

  /**
   * Fetches and checks if the wallet has sufficient TON balance
   * Updates step status based on the verification result
   */
  const checkBalance = async () => {
    if (!userAddress) return;

    setIsLoading(true);
    setStepRunning(STEP_ID.CHECK_BALANCE);
    
    try {
      const account = await getAccountState(Address.parse(userAddress));
      const balance = BigInt(account.account.balance.coins);
      setBalance(balance);

      if (balance >= REQUIRED_BALANCE) {
        setStepSuccess(STEP_ID.CHECK_BALANCE);
        props.onStatusChange?.('success');
      } else {
        setStepFailure(STEP_ID.CHECK_BALANCE);
        props.onStatusChange?.('failure');
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setStepFailure(STEP_ID.CHECK_BALANCE);
      props.onStatusChange?.('failure');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Renders balance check instructions
   */
  const renderBalanceInstructions = (): ReactNode => (
    <Alert>
      <AlertDescription className="space-y-2">
        <p>Checking your TON balance:</p>
        <ul className="list-disc pl-4 space-y-1 text-sm">
          <li>Minimum required: <TONAmount amount={REQUIRED_BALANCE} /></li>
          <li>This amount is needed to get test tokens</li>
        </ul>
      </AlertDescription>
    </Alert>
  );

  /**
   * Renders wallet details and current balance
   */
  const renderBalanceDetails = (): ReactNode => {
    if (balance === null || !userAddress) return null;
    
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm space-y-1">
          <div>Current balance: <TONAmount amount={balance} className="font-medium" /></div>
          <div>Connected address: <AccountLink address={userAddress} /></div>
        </div>
      </div>
    );
  };

  /**
   * Renders success message when wallet has sufficient balance
   */
  const renderSuccessMessage = (): ReactNode => {
    if (balance === null || balance < REQUIRED_BALANCE) return null;
    
    return (
      <div className="text-sm text-green-600">
        ✓ Your wallet has enough TON
      </div>
    );
  };

  /**
   * Renders error message when wallet has insufficient balance
   */
  const renderErrorMessage = (): ReactNode => {
    if (balance === null || balance >= REQUIRED_BALANCE) return null;
    
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertDescription className="space-y-2">
          <p>Not enough TON:</p>
          <div className="mt-2 text-sm bg-red-500/10 p-4 rounded space-y-2">
            <ul className="list-disc pl-4 space-y-1">
              <li>Your balance: <TONAmount amount={balance} /></li>
              <li>Minimum needed: <TONAmount amount={REQUIRED_BALANCE} /></li>
              <li>Get test TON from the faucet to continue</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  /**
   * Renders refresh button to check balance again
   */
  const renderRefreshButton = (): ReactNode => {
    if (props.testCase.status === 'success') return null;
    
    return (
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={checkBalance}
          disabled={isLoading || !userAddress}
          className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600"
        >
          <RotateCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Balance
        </Button>
      </div>
    );
  };

  /**
   * Renders the main content for the balance check step
   */
  const renderBalanceCheckContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      {renderBalanceInstructions()}
      {renderBalanceDetails()}
      {renderSuccessMessage()}
      {renderErrorMessage()}
      {renderRefreshButton()}
    </div>
  );

  /**
   * Initiates balance check when wallet is connected and test is pending
   */
  useEffect(() => {
    if (!userAddress) {
      setStepPending(STEP_ID.CHECK_BALANCE);
      props.onStatusChange?.('pending');
      return;
    }

    if (props.testCase.status === 'pending') {
      checkBalance();
    }
  }, [userAddress, props.testCase.status]);

  /**
   * Updates step content based on current state
   */
  useEffect(() => {
    updateStepDetails(STEP_ID.CHECK_BALANCE, renderBalanceCheckContent());
  }, [props.testCase.status, balance, userAddress, isLoading]);

  return (
    <BaseTestCase {...props}>
      <div className="flex flex-col">
        <TestStepsList steps={steps} />
      </div>
    </BaseTestCase>
  );
} 