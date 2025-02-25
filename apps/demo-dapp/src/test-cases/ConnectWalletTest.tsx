import { BaseTestCase, BaseTestCaseProps } from "./BaseTestCase";
import { useTonConnect } from "@/hooks/use-ton-connect";
import { useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { TestStepsList } from "@/components/test-steps/TestStepsList";
import { useTestSteps } from "@/hooks/use-test-steps";
import { TestStep } from "@/types/test-steps";
import { AccountLink } from "@/components/ton/links";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CHAIN } from "@tonconnect/ui-react";

/**
 * Step identifiers used throughout the component
 */
const STEP_ID = {
  CONNECT: 'click-connect',
  POPUP: 'wallet-popup',
  APPROVE: 'user-approve',
  CHECK: 'connection-check',
  TESTNET: 'testnet-check'
} as const;

/**
 * Default test steps for wallet connection process
 */
const DEFAULT_STEPS: TestStep[] = [
  {
    id: STEP_ID.CONNECT,
    title: 'Connect Wallet',
    description: 'Connect your testnet wallet to start testing',
    type: 'user-action',
    status: 'pending'
  },
  {
    id: STEP_ID.POPUP,
    title: 'Connection Request',
    description: 'Wallet should show TON Connect connection request',
    type: 'wallet-action',
    status: 'pending'
  },
  {
    id: STEP_ID.APPROVE,
    title: 'Approve Connection',
    description: 'Review and approve the connection in your wallet',
    type: 'user-action',
    status: 'pending'
  },
  {
    id: STEP_ID.CHECK,
    title: 'Feature Check',
    description: 'Verifying Extra Currency support in wallet features',
    type: 'auto-check',
    status: 'pending'
  },
  {
    id: STEP_ID.TESTNET,
    title: 'Testnet Check',
    description: 'Verifying wallet is connected to testnet',
    type: 'auto-check',
    status: 'pending'
  }
];

/**
 * Wallet connection test component for Extra Currency Testing stand
 */
export function ConnectWalletTest(props: BaseTestCaseProps) {
  const { connect, userAddress, isConnected, wallet } = useTonConnect();
  const { 
    steps, 
    updateStepDetails,
    updateStepsStatus,
    setAllStepsStatus
  } = useTestSteps({
    defaultSteps: DEFAULT_STEPS,
    testStatus: props.testCase.status
  });

  /**
   * Handles wallet connection initiation
   */
  const handleConnect = () => {
    connect();
    props.onStatusChange?.('running');
    updateStepsStatus([
      { id: STEP_ID.CONNECT, status: 'success' },
      { id: STEP_ID.POPUP, status: 'running' }
    ]);
  };

  /**
   * Renders the content for the connection button step
   */
  const renderConnectButtonContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription className="space-y-2">
          <p>Connect your wallet to start testing Extra Currency support.</p>
          <p className="text-sm text-muted-foreground">Requirements:</p>
          <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
            <li>Testnet wallet</li>
            <li>TON Connect v2 support</li>
          </ul>
        </AlertDescription>
      </Alert>
      {props.testCase.status === 'success' && (
        <div className="text-sm text-green-600">
          ✓ Connect button clicked
        </div>
      )}
      {props.testCase.status === 'pending' && !isConnected && (
        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleConnect}
            className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </div>
      )}
    </div>
  );

  /**
   * Renders the content for the wallet popup step
   */
  const renderWalletPopupContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Your wallet should display a TON Connect connection request. If you don't see it, check if it was blocked by your browser.
        </AlertDescription>
      </Alert>
      {props.testCase.status === 'success' && (
        <div className="text-sm text-green-600">
          ✓ Connection request received
        </div>
      )}
    </div>
  );

  /**
   * Renders the content for the user approval step
   */
  const renderApprovalContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Review the connection request in your wallet.
        </AlertDescription>
      </Alert>
      {props.testCase.status === 'success' && (
        <div className="text-sm text-green-600">
          ✓ Connection approved
        </div>
      )}
    </div>
  );

  /**
   * Renders the content for the feature verification step
   */
  const renderVerificationContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription className="space-y-2">
          <p>Verifying wallet features:</p>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            <li>TON Connect connection</li>
            <li>Wallet address access</li>
          </ul>
        </AlertDescription>
      </Alert>
      {isConnected && userAddress && (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-green-600">
            ✓ Wallet successfully connected
          </div>
          <div className="text-sm">
            Testing wallet: <AccountLink address={userAddress} />
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Renders the content for the testnet verification step
   */
  const renderTestnetCheckContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription className="space-y-2">
          <p>Verifying wallet network:</p>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            <li>Checking if connected to testnet</li>
          </ul>
        </AlertDescription>
      </Alert>
      {isConnected && wallet && (
        <div className="flex flex-col gap-2">
          {wallet.account.chain === CHAIN.TESTNET ? (
            <div className="text-sm text-green-600">
              ✓ Wallet connected to testnet
            </div>
          ) : (
            <div className="text-sm text-red-600">
              ✗ Wallet is not connected to testnet. Please use a testnet wallet for testing.
            </div>
          )}
        </div>
      )}
    </div>
  );

  /**
   * Updates all step contents with their respective rendered components
   */
  useEffect(() => {
    updateStepDetails(STEP_ID.CONNECT, renderConnectButtonContent());
    updateStepDetails(STEP_ID.POPUP, renderWalletPopupContent());
    updateStepDetails(STEP_ID.APPROVE, renderApprovalContent());
    updateStepDetails(STEP_ID.CHECK, renderVerificationContent());
    updateStepDetails(STEP_ID.TESTNET, renderTestnetCheckContent());
  }, [props.testCase.status, isConnected, userAddress, wallet]);

  /**
   * Handles connection status changes and updates test status accordingly
   */
  useEffect(() => {
    if (isConnected) {
      if (wallet && wallet.account.chain === CHAIN.TESTNET) {
        // When connection is successful and on testnet, update all steps to success
        setAllStepsStatus('success');
        props.onStatusChange?.('success');
      } else {
        // Update testnet check step to failed if not on testnet
        updateStepsStatus([
          { id: STEP_ID.CONNECT, status: 'success' },
          { id: STEP_ID.POPUP, status: 'success' },
          { id: STEP_ID.APPROVE, status: 'success' },
          { id: STEP_ID.CHECK, status: 'success' },
          { id: STEP_ID.TESTNET, status: 'failure' }
        ]);
        props.onStatusChange?.('failure');
      }
    } else if (props.testCase.status === 'success') {
      // If disconnected but test was previously successful, reset to pending
      setAllStepsStatus('pending');
      props.onStatusChange?.('pending');
    }
  }, [isConnected, props.testCase.status, wallet]);

  /**
   * Handles connection process steps when test is running but not yet connected
   */
  useEffect(() => {
    if (props.testCase.status === 'running' && !isConnected) {
      updateStepsStatus([
        { id: STEP_ID.CONNECT, status: 'success' },
        { id: STEP_ID.POPUP, status: 'running' },
        { id: STEP_ID.APPROVE, status: 'pending' }
      ]);
    }
  }, [props.testCase.status, isConnected]);

  return (
    <BaseTestCase {...props}>
      <div className="flex flex-col">
        <TestStepsList steps={steps} />
      </div>
    </BaseTestCase>
  );
} 