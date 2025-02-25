import { BaseTestCase, BaseTestCaseProps } from "./BaseTestCase";
import { useTonConnect } from "@/hooks/use-ton-connect";
import { useEffect, useState, useRef, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Address, toNano } from "@ton/ton";
import { useTonConnectUI } from '@tonconnect/ui-react';
import { getLastAccountTransactions, getAccountState } from "@/lib/ton-client";
import { TestStepsList } from "@/components/test-steps/TestStepsList";
import { useTestSteps } from "@/hooks/use-test-steps";
import { TestStep } from "@/types/test-steps";
import { AccountLink, ContractLink, TransactionLink } from "@/components/ton/links";
import { TONAmount, ECAmount } from "@/components/ton";
import { EC_SWAP_ADDRESS, EC_TOKEN_ID, EC_DECIMALS } from "@/constants";

/**
 * Constants for test parameters
 */
const MIN_TON_AMOUNT = toNano(3);
const MIN_DUST_AMOUNT = toNano(0.1);
const MAX_DUST_AMOUNT = toNano(0.25);
const STEP = toNano(0.01);
const CHECK_INTERVAL = 5000; // 5 seconds
const MAX_CHECK_TIME = 60000; // 1 minute

/**
 * Step identifiers used throughout the component
 */
const STEP_ID = {
  CALCULATE_AMOUNTS: 'calculate-amounts',
  SEND_TON: 'send-ton',
  CHECK_TX: 'check-tx',
  CHECK_EC: 'check-ec'
} as const;

/**
 * Default test steps for EC swap operation
 */
const DEFAULT_STEPS: TestStep[] = [
  {
    id: STEP_ID.CALCULATE_AMOUNTS,
    title: 'Prepare Test Transaction',
    description: 'Calculating test amounts for EC swap operation',
    type: 'auto-check',
    status: 'pending'
  },
  {
    id: STEP_ID.SEND_TON,
    title: 'Get Test EC',
    description: 'Send TON to swap contract to receive test Extra Currency',
    type: 'user-action',
    status: 'locked'
  },
  {
    id: STEP_ID.CHECK_TX,
    title: 'Verify Swap',
    description: 'Checking swap contract response with EC transfer',
    type: 'auto-check',
    status: 'locked'
  },
  {
    id: STEP_ID.CHECK_EC,
    title: 'EC Balance Update',
    description: 'Verifying EC balance update in your wallet',
    type: 'auto-check',
    status: 'locked'
  }
];

/**
 * Calculate expected EC amount based on TON amount
 * @param tonAmount Amount in TON (nanotons)
 * @returns Expected EC amount
 */
function calculateExpectedEc(tonAmount: bigint): bigint {
  const delta = tonAmount - MIN_TON_AMOUNT;
  const steps = delta / STEP;
  return (steps) * (10n ** BigInt(EC_DECIMALS)) / 10n;
}

/**
 * Generate random amount between MIN and MAX with STEP precision
 * @returns Random TON amount for the swap operation
 */
function generateRandomAmount(): bigint {
  const steps = (MAX_DUST_AMOUNT - MIN_DUST_AMOUNT) / STEP;
  const randomSteps = Math.floor(Math.random() * (Number(steps) + 1));
  return MIN_TON_AMOUNT + MIN_DUST_AMOUNT + (BigInt(randomSteps) * STEP);
}

/**
 * Test component for testing extra currency swap functionality
 */
export function GetTestEcTest(props: BaseTestCaseProps) {
  const [tonConnectUI] = useTonConnectUI();
  const { userAddress, checkWalletFeatures } = useTonConnect();
  
  // Transaction state
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [foundTxHash, setFoundTxHash] = useState<string | null>(null);
  const [sentAmount, setSentAmount] = useState<bigint | null>(() => {
    const stored = localStorage.getItem('ec_topup_amount');
    return stored ? BigInt(stored) : null;
  });
  const [startLt, setStartLt] = useState<string | null>(null);
  const [expectedEc, setExpectedEc] = useState<bigint | null>(() => {
    const stored = localStorage.getItem('expected_ec_amount');
    return stored ? BigInt(stored) : null;
  });
  const [_errorDetails, setErrorDetails] = useState<ReactNode | null>(null);
  const [_ecBalance, setEcBalance] = useState<bigint | null>(null);
  
  // Tracking references
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Test steps management
  const { 
    steps, 
    updateStepDetails,
    setStepSuccess,
    setStepFailure,
    setStepRunning,
    updateStepsStatus
  } = useTestSteps({
    defaultSteps: DEFAULT_STEPS,
    testStatus: props.testCase.status
  });

  /**
   * Calculate test amounts for EC swap operation
   */
  const calculateAmounts = () => {
    // Clear localStorage before calculating new amounts
    localStorage.removeItem('ec_topup_amount');
    localStorage.removeItem('expected_ec_amount');
    
    const amount = generateRandomAmount();
    const expectedEcAmount = calculateExpectedEc(amount);
    
    setSentAmount(amount);
    setExpectedEc(expectedEcAmount);
    localStorage.setItem('ec_topup_amount', amount.toString());
    localStorage.setItem('expected_ec_amount', expectedEcAmount.toString());

    setStepSuccess(STEP_ID.CALCULATE_AMOUNTS);
    updateStepsStatus([{ id: STEP_ID.SEND_TON, status: 'pending' }]);
  };

  /**
   * Handle getting test EC by sending TON to swap contract
   */
  const handleGetTestEc = async () => {
    const walletFeatures = checkWalletFeatures();
    if (!walletFeatures.isConnected || !walletFeatures.userAddress) return;

    setLastTxHash(null);
    setStartLt(null);
    setErrorDetails(null);
    
    try {
      // Get current account state to save LT if account is initialized
      const account = await getAccountState(Address.parse(walletFeatures.userAddress));
      if (account.account.last) {
        setStartLt(account.account.last.lt);
      }

      props.onStatusChange?.('running');

      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 360, // 5 minutes from now
        messages: [
          {
            address: EC_SWAP_ADDRESS,
            amount: sentAmount!.toString(),
          }
        ],
      });

      setLastTxHash(result.boc);
      startTimeRef.current = Date.now();
      setStepSuccess(STEP_ID.SEND_TON);
      updateStepsStatus([{ id: STEP_ID.CHECK_TX, status: 'pending' }]);
    } catch (error) {
      console.error('Failed to send transaction:', error);
      setErrorDetails(<>Failed to send transaction to the blockchain</>);
      setStepFailure(STEP_ID.SEND_TON);
      props.onStatusChange?.('failure');
    }
  };

  /**
   * Renders the content for the calculate amounts step
   */
  const renderCalculateAmountsContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription className="space-y-2">
          <p>Preparing test transaction with the following parameters:</p>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            <li>Base amount: <TONAmount amount={MIN_TON_AMOUNT} /></li>
            <li>Random dust: <TONAmount amount={MIN_DUST_AMOUNT} /> — <TONAmount amount={MAX_DUST_AMOUNT} /> (for unique transaction amount)</li>
            <li>Expected EC: <ECAmount amount={STEP} /> per <TONAmount amount={STEP} /> above base amount</li>
          </ul>
        </AlertDescription>
      </Alert>
      {sentAmount && expectedEc ? (
        <div className="text-sm space-y-1">
          <div>Total TON to send: <TONAmount amount={sentAmount} /></div>
          <div>Expected EC to receive: <ECAmount amount={expectedEc} /></div>
        </div>
      ) : null}
    </div>
  );

  /**
   * Renders the content for the send TON step
   */
  const renderSendTonContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription className="space-y-2">
          <p>Send TON to the swap contract to get test EC. Your wallet should:</p>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            <li>Show correct TON amount in the transaction preview</li>
            <li>Display destination as the EC swap contract</li>
            <li>If emulation is supported, show expected EC amount to receive</li>
          </ul>
        </AlertDescription>
      </Alert>
      {props.testCase.status === 'pending' && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetTestEc}
            className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600"
          >
            Swap <TONAmount amount={sentAmount} /> to <ECAmount amount={expectedEc} />
          </Button>
        </div>
      )}
      {props.testCase.status === 'success' && (
        <div className="text-sm text-green-600">
          ✓ Transaction sent to swap contract
        </div>
      )}
    </div>
  );

  /**
   * Renders the content for the check transaction step
   */
  const renderCheckTxContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription className="space-y-2">
          <p>Verifying swap contract response. Expecting an incoming message with:</p>
          <ul className="list-disc pl-4 space-y-1 text-sm">
            <li><ECAmount amount={expectedEc} /> transfer</li>
            <li>Source: EC swap contract</li>
          </ul>
        </AlertDescription>
      </Alert>
      {foundTxHash && (
        <div className="text-sm">
          Transaction: <TransactionLink hash={foundTxHash} />
        </div>
      )}
    </div>
  );

  /**
   * Renders the content for the check EC balance step
   */
  const renderCheckEcContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription className="space-y-2">
          <p>Verifying EC balance update in your wallet.</p>
          <p className="text-sm text-muted-foreground">
            Your wallet should now show the received Extra Currency balance with correct decimals formatting.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );

  /**
   * Initialize calculation when the test is in pending status
   */
  useEffect(() => {
    if (props.testCase.status === 'pending') {
      // If we have stored values and they're valid, use them
      if (sentAmount && expectedEc) {
        setStepSuccess(STEP_ID.CALCULATE_AMOUNTS);
        updateStepsStatus([{ id: STEP_ID.SEND_TON, status: 'pending' }]);
      } else if (!sentAmount && !expectedEc) {
        // Only calculate new amounts if we don't have stored values
        calculateAmounts();
      }
    } else if (props.testCase.status === 'failure') {
      // If test failed, show failure state in steps
      if (sentAmount && expectedEc) {
        setStepSuccess(STEP_ID.CALCULATE_AMOUNTS);
      }
    }
  }, [props.testCase.status, sentAmount, expectedEc]);

  /**
   * Monitor transaction status when a transaction has been sent
   */
  useEffect(() => {
    if (props.testCase.status === 'running' && !expectedEc) {
      props.onStatusChange?.('pending');
      return;
    }

    const walletFeatures = checkWalletFeatures();
    if (props.testCase.status !== 'running' || !lastTxHash || !walletFeatures.userAddress || !sentAmount || !expectedEc) return;

    const checkTransactions = async () => {
      try {
        setStepRunning(STEP_ID.CHECK_TX);
        const transactions = await getLastAccountTransactions(Address.parse(walletFeatures.userAddress));
        
        // Filter transactions based on whether we have a start LT or not
        const relevantTransaction = transactions.find(tx => {
          // Check if this is an internal message from ec_swap
          const message = tx.inMessage;
          if (!message) return false;
          
          const info = message.info;
          if (info.type !== 'internal' || !info.src.equals(Address.parse(EC_SWAP_ADDRESS))) {
            return false;
          }

          // If we have a start LT, only consider transactions after it
          if (startLt && BigInt(tx.lt) <= BigInt(startLt)) return false;

          // Check if the message contains the expected EC amount
          return true;
        });

        if (relevantTransaction) {
          const txHash = relevantTransaction.hash().toString('hex');
          setFoundTxHash(txHash);
          // Check if the message contains expected EC amount
          const message = relevantTransaction.inMessage;
          if (message?.info.type !== 'internal' || !message?.info.src.equals(Address.parse(EC_SWAP_ADDRESS))) {
            setErrorDetails(<>Received message is not from EC swap contract</>);
            setStepFailure(STEP_ID.CHECK_TX);
            props.onStatusChange?.('failure');
            return;
          }

          if (!message?.info.value.other?.has(EC_TOKEN_ID)) {
            setErrorDetails(<>No EC token (ID: {EC_TOKEN_ID}) found in the response message</>);
            setStepFailure(STEP_ID.CHECK_TX);
            props.onStatusChange?.('failure');
            return;
          }

          const ecAmount = message?.info.value.other?.get(EC_TOKEN_ID) ?? null;
          if (ecAmount !== expectedEc) {
            setErrorDetails(
              <>Received incorrect EC amount. Expected: <ECAmount amount={expectedEc} />, Received: <ECAmount amount={ecAmount} /></>
            );
            setStepFailure(STEP_ID.CHECK_TX);
            props.onStatusChange?.('failure');
            return;
          }

          // Found a response transaction from ec_swap with correct EC amount
          setStepSuccess(STEP_ID.CHECK_TX);
          updateStepsStatus([{ id: STEP_ID.CHECK_EC, status: 'pending' }]);

          // Check EC balance
          setStepRunning(STEP_ID.CHECK_EC);
          const account = await getAccountState(Address.parse(walletFeatures.userAddress));
          const balance = BigInt(account.account.balance.currencies[EC_TOKEN_ID] || 0n);
          setEcBalance(balance);

          if (balance > 0n) {
            setStepSuccess(STEP_ID.CHECK_EC);
            props.onStatusChange?.('success');
          } else {
            setStepFailure(STEP_ID.CHECK_EC);
            setErrorDetails(<>No Extra Currency received after the transaction</>);
            props.onStatusChange?.('failure');
          }

          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
          }
          return;
        }

        // Check if we've exceeded the time limit
        if (startTimeRef.current && Date.now() - startTimeRef.current > MAX_CHECK_TIME) {
          setErrorDetails(
            <>
              <p className="font-semibold">Transaction timeout:</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Error: No matching transaction found within {MAX_CHECK_TIME / 1000} seconds</li>
                <li>Expected sent amount: <TONAmount amount={sentAmount} /></li>
                <li>Expected received amount: <ECAmount amount={expectedEc} /></li>
                <li>From address: <AccountLink address={walletFeatures.userAddress} /></li>
              </ul>
              <p className="mt-2 text-sm italic">Note: Make sure you sent the transaction and it was included in the blockchain</p>
            </>
          );
          setStepFailure(STEP_ID.CHECK_TX);
          props.onStatusChange?.('failure');
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
          }
          return;
        }

        // Schedule next check
        checkTimeoutRef.current = setTimeout(checkTransactions, CHECK_INTERVAL);
      } catch (error) {
        setErrorDetails(
          <>
            <p className="font-semibold">Transaction check failed:</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Error: {error instanceof Error ? error.message : 'Unknown error'}</li>
              <li>Contract: <ContractLink address={EC_SWAP_ADDRESS} /></li>
            </ul>
            <p className="mt-2 text-sm italic">Note: This is usually a temporary error, please try again</p>
          </>
        );
        setStepFailure(STEP_ID.CHECK_TX);
        props.onStatusChange?.('failure');
      }
    };

    checkTransactions();

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [props.testCase.status, lastTxHash, startLt, userAddress, sentAmount, expectedEc]);

  /**
   * Update step details with rendered content
   */
  useEffect(() => {
    updateStepDetails(STEP_ID.CALCULATE_AMOUNTS, renderCalculateAmountsContent());
    updateStepDetails(STEP_ID.SEND_TON, renderSendTonContent());
    updateStepDetails(STEP_ID.CHECK_TX, renderCheckTxContent());
    updateStepDetails(STEP_ID.CHECK_EC, renderCheckEcContent());
  }, [props.testCase.status, sentAmount, expectedEc, foundTxHash]);

  return (
    <BaseTestCase {...props}>
      <div className="flex flex-col">
        <TestStepsList steps={steps} />
      </div>
    </BaseTestCase>
  );
} 