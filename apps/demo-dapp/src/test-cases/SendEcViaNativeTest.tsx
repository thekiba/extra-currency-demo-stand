import { BaseTestCase, BaseTestCaseProps } from "./BaseTestCase";
import { useTonConnect } from "@/hooks/use-ton-connect";
import { useEffect, useState, useRef, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RotateCw, Check } from "lucide-react";
import { Address } from "@ton/ton";
import { getAccountState, getLastAccountTransactions } from "@/lib/ton-client";
import { Code } from "@/components/ui/code";
import { TestStepsList } from "@/components/test-steps/TestStepsList";
import { useTestSteps } from "@/hooks/use-test-steps";
import { TestStep } from "@/types/test-steps";
import { TransactionLink, ContractLink, AccountLink } from "@/components/ton/links";
import { ECAmount, TONAmount } from "@/components/ton";
import { EC_SWAP_ADDRESS, EC_TOKEN_ID, EC_DECIMALS } from "@/constants";

/**
 * Constants for test parameters
 */
const CHECK_INTERVAL = 5000; // 5 seconds
const MAX_CHECK_TIME = 60000; // 1 minute
const MIN_AMOUNT = BigInt(0.01 * 10 ** EC_DECIMALS);

/**
 * Step identifiers used throughout the component
 */
const STEP_ID = {
  CALCULATE_AMOUNT: 'calculate-amount',
  SEND_EC: 'send-ec',
  CHECK_TX: 'check-tx'
} as const;

/**
 * Default test steps for sending EC via native wallet interface
 */
const DEFAULT_STEPS: TestStep[] = [
  {
    id: STEP_ID.CALCULATE_AMOUNT,
    title: 'Calculate Amount',
    description: 'Preparing random EC amount for the test transfer',
    type: 'auto-check',
    status: 'pending'
  },
  {
    id: STEP_ID.SEND_EC,
    title: 'Send EC',
    description: "Send Extra Currency using your wallet's native interface",
    type: 'user-action',
    status: 'locked'
  },
  {
    id: STEP_ID.CHECK_TX,
    title: 'Verify Transfer',
    description: 'Checking if the transfer was completed correctly',
    type: 'auto-check',
    status: 'locked'
  }
];

/**
 * Component for testing native EC transfer functionality in TON Connect wallets
 */
export function SendEcViaNativeTest(props: BaseTestCaseProps) {
  const { userAddress } = useTonConnect();
  const [targetAmount, setTargetAmount] = useState<bigint | null>(null);
  const [startLt, setStartLt] = useState<string | null>(null);
  const [foundTxHash, setFoundTxHash] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ReactNode | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

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
   * Calculates a random amount of EC to send based on user's balance
   * Amount is between 0.01 EC and 10% of user's balance
   */
  const calculateRandomAmount = async (address: string): Promise<bigint> => {
    const account = await getAccountState(Address.parse(address));
    const balance = BigInt(account.account.balance.currencies[EC_TOKEN_ID] || 0n);
    
    // Calculate minimum amount (0.01 EC)
    const minAmount = MIN_AMOUNT;
    
    // Calculate maximum amount (10% of balance)
    const maxAmount = balance / 10n;
    
    if (maxAmount < minAmount) {
      setErrorDetails(
        <>
          <p className="font-semibold">Not enough Extra Currency:</p>
          <ul className="list-disc pl-4 mt-2 space-y-1">
            <li>Your balance: <ECAmount amount={balance} /></li>
            <li>Maximum transfer (10%): <ECAmount amount={maxAmount} /></li>
            <li>Minimum required: <ECAmount amount={minAmount} /></li>
          </ul>
          <p className="mt-2 text-sm italic">Get more test EC to continue with this test</p>
        </>
      );
      props.onStatusChange?.('failure');
      throw new Error('Insufficient balance');
    }

    // Generate random amount between minAmount and maxAmount
    const range = maxAmount - minAmount;
    const random = BigInt(Math.floor(Math.random() * Number(range)));
    return minAmount + random;
  };

  /**
   * Starts the transaction verification process
   * Called when user confirms they've sent the EC
   */
  const startCheck = async () => {
    if (!userAddress) return;
    setIsChecking(true);
    setStepSuccess(STEP_ID.SEND_EC);
    updateStepsStatus([{ id: STEP_ID.CHECK_TX, status: 'pending' }]);
    props.onStatusChange?.('running');
    startTimeRef.current = Date.now();
  };

  /**
   * Resets the test to initial state for retry
   */
  const handleRetry = () => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    startTimeRef.current = null;
    setFoundTxHash(null);
    setTargetAmount(null);
    setStartLt(null);
    setErrorDetails(null);
    setIsChecking(false);
    props.onStatusChange?.('pending');
    
    // Reset steps to initial state
    updateStepsStatus([
      { id: STEP_ID.CALCULATE_AMOUNT, status: 'pending' },
      { id: STEP_ID.SEND_EC, status: 'locked' },
      { id: STEP_ID.CHECK_TX, status: 'locked' }
    ]);
  };

  /**
   * Renders the content for the amount calculation step
   */
  const renderCalculateAmountContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Calculating random amount to send:
          <ul className="list-disc list-inside mt-2">
            <li>Minimum amount: <ECAmount amount={MIN_AMOUNT} /></li>
            <li>Maximum amount: 10% of your current balance</li>
          </ul>
        </AlertDescription>
      </Alert>
      {typeof targetAmount === 'bigint' && (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-green-600">
            ✓ Amount calculated successfully
          </div>
          <div className="text-sm">
            Will send: <ECAmount amount={targetAmount} />
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Renders the content for the EC sending step
   */
  const renderSendEcContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription className="flex flex-col gap-2">
          <div>Please send <Code><ECAmount amount={targetAmount} showSuffix={false} /></Code> EC to:</div>
          <Code className="break-all">{EC_SWAP_ADDRESS}</Code>
          <div>using your wallet's native interface</div>
          <div className="mt-2 text-sm">
            Important:
            <ul className="list-disc list-inside mt-1">
              <li>Use your wallet's native EC transfer interface</li>
              <li>Do not send any TON value with the transfer</li>
              <li>Send exactly the requested amount</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
      {props.testCase.status === 'success' && (
        <div className="text-sm text-green-600">
          ✓ Transaction sent successfully
        </div>
      )}
      {props.testCase.status === 'pending' && (
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={startCheck}
            className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600"
          >
            <Check className="w-4 h-4 mr-2" />
            Done
          </Button>
        </div>
      )}
      {props.testCase.status === 'failure' && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      )}
    </div>
  );

  /**
   * Renders the transaction verification instructions
   */
  const renderVerificationInstructions = (): ReactNode => (
    <Alert>
      <AlertDescription>
        Verifying that your transaction was processed correctly. The transaction should:
        <ul className="list-disc list-inside mt-2">
          <li>Send exactly <ECAmount amount={targetAmount} /></li>
          <li>Not include any TON value</li>
          <li>Be sent to the correct contract <ContractLink address={EC_SWAP_ADDRESS} /></li>
          <li>Be included in the blockchain</li>
        </ul>
      </AlertDescription>
    </Alert>
  );

  /**
   * Renders the transaction success message
   */
  const renderTransactionSuccess = (): ReactNode => (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-green-600">
        ✓ Transaction found and verified
      </div>
      <TransactionLink hash={foundTxHash!} />
    </div>
  );

  /**
   * Renders the transaction error details
   */
  const renderTransactionError = (): ReactNode => (
    <Alert variant="destructive" className="mt-4">
      <AlertDescription className="flex flex-col gap-2">
        <div>
          Failed to verify Extra Currency transfer:
          <div className="mt-2 text-sm bg-red-500/10 p-2 rounded">
            {errorDetails}
          </div>
        </div>
        {userAddress && <AccountLink address={userAddress} />}
        {typeof targetAmount === 'bigint' && (
          <div className="text-sm">
            Expected amount: <ECAmount amount={targetAmount} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          {foundTxHash && <TransactionLink hash={foundTxHash} />}
          <ContractLink address={EC_SWAP_ADDRESS} />
        </div>
      </AlertDescription>
    </Alert>
  );

  /**
   * Renders the content for the transaction check step
   */
  const renderCheckTxContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      {renderVerificationInstructions()}
      {foundTxHash && renderTransactionSuccess()}
      {errorDetails && props.testCase.status === 'failure' && renderTransactionError()}
    </div>
  );

  /**
   * Effect to initialize calculation when test is pending
   */
  useEffect(() => {
    if (props.testCase.status === 'pending' && !targetAmount) {
      setStepRunning(STEP_ID.CALCULATE_AMOUNT);
      if (userAddress) {
        getAccountState(Address.parse(EC_SWAP_ADDRESS))
          .then(account => {
            if (!account.account.last) {
              throw new Error('Swap account not found');
            }
            setStartLt(account.account.last.lt);

            return calculateRandomAmount(userAddress)
          })
          .then(amount => {
            setTargetAmount(amount);
            setStepSuccess(STEP_ID.CALCULATE_AMOUNT);
            updateStepsStatus([{ id: STEP_ID.SEND_EC, status: 'pending' }]);
          })
          .catch((error) => {
            console.error('Error calculating amount:', error);
            setStepFailure(STEP_ID.CALCULATE_AMOUNT);
          });
      }
    } else if (props.testCase.status === 'failure' && !targetAmount && !errorDetails) {
      handleRetry();
    } else if (targetAmount) {
      setStepSuccess(STEP_ID.CALCULATE_AMOUNT);
    }
  }, [props.testCase.status, userAddress, targetAmount]);

  /**
   * Effect to check transaction status when isChecking is true
   */
  useEffect(() => {
    if (!isChecking || !userAddress || !targetAmount) return;

    const checkTransactions = async () => {
      try {
        setStepRunning(STEP_ID.CHECK_TX);
        // Get transactions from ec_swap contract instead of user's wallet
        const transactions = await getLastAccountTransactions(Address.parse(EC_SWAP_ADDRESS));
        
        // Filter transactions based on whether we have a start LT or not
        const relevantTransaction = transactions.find(tx => {
          // Look for internal messages in transaction
          const inMessage = tx.inMessage;
          if (!inMessage || inMessage.info.type !== 'internal') return false;

          // Check if the message is from our user's address
          if (!inMessage.info.src.equals(Address.parse(userAddress))) return false;

          // If we have a start LT, only consider transactions after it
          if (startLt && BigInt(tx.lt) <= BigInt(startLt)) return false;

          // Check if the message contains EC transfer
          if (!inMessage.info.value.other?.has(EC_TOKEN_ID)) return false;

          return true;
        });

        if (relevantTransaction) {
          const txHash = relevantTransaction.hash().toString('hex');
          setFoundTxHash(txHash);
          
          const inMessage = relevantTransaction.inMessage;
          if (!inMessage || inMessage.info.type !== 'internal') {
            setErrorDetails(
              <>
                <p className="font-semibold">Transaction validation error:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li>Expected: Internal message to EC swap</li>
                  <li>Found: {!inMessage ? 'No message' : `Message type: ${inMessage.info.type}`}</li>
                </ul>
              </>
            );
            setStepFailure(STEP_ID.CHECK_TX);
            props.onStatusChange?.('failure');
            setIsChecking(false);
            return;
          }

          const ecAmount = inMessage.info.value.other?.get(EC_TOKEN_ID) ?? null;
          if (ecAmount !== targetAmount) {
            setErrorDetails(
              <>
                <p className="font-semibold">Amount validation error:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li>Expected: <ECAmount amount={targetAmount} /></li>
                  <li>Found: <ECAmount amount={ecAmount} /></li>
                </ul>
                <p className="mt-2 text-sm italic">Make sure to send the exact amount</p>
              </>
            );
            setStepFailure(STEP_ID.CHECK_TX);
            props.onStatusChange?.('failure');
            setIsChecking(false);
            return;
          }

          const tonAmount = inMessage.info.value.coins;
          if (tonAmount !== 0n) {
            setErrorDetails(
              <>
                <p className="font-semibold">TON value error:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li>Expected: <TONAmount amount={0n} /></li>
                  <li>Found: <TONAmount amount={tonAmount} /></li>
                </ul>
                <p className="mt-2 text-sm italic">Disable "Send with value" in your wallet if available</p>
              </>
            );
            setStepFailure(STEP_ID.CHECK_TX);
            props.onStatusChange?.('failure');
            setIsChecking(false);
            return;
          }

          const description = relevantTransaction.description;
          if (description.type !== 'generic') {
            setErrorDetails(
              <>
                <p className="font-semibold">Transaction type error:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li>Expected: Generic transaction</li>
                  <li>Found: {description.type} transaction</li>
                </ul>
                <p className="mt-2 text-sm italic">Use the native EC transfer interface in your wallet</p>
              </>
            );
            setStepFailure(STEP_ID.CHECK_TX);
            props.onStatusChange?.('failure');
            setIsChecking(false);
            return;
          }

          const computePhase = description.computePhase;
          if (computePhase.type !== 'skipped') {
            setErrorDetails(
              <>
                <p className="font-semibold">Execution phase error:</p>
                <ul className="list-disc pl-4 mt-2 space-y-1">
                  <li>Expected: Skipped compute phase</li>
                  <li>Found: {computePhase.type} phase</li>
                </ul>
                <p className="mt-2 text-sm italic">Use the native EC transfer interface in your wallet</p>
              </>
            );
            setStepFailure(STEP_ID.CHECK_TX);
            props.onStatusChange?.('failure');
            setIsChecking(false);
            return;
          }

          // Found a correct transaction
          setStepSuccess(STEP_ID.CHECK_TX);
          props.onStatusChange?.('success');
          setIsChecking(false);
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
          }
          return;
        }

        // Check if we've exceeded the time limit
        if (startTimeRef.current && Date.now() - startTimeRef.current > MAX_CHECK_TIME) {
          const timeoutMinutes = MAX_CHECK_TIME / 60000;
          setErrorDetails(
            <>
              <p className="font-semibold">Transaction timeout:</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Error: No matching transaction found within {timeoutMinutes} minutes</li>
                <li>Expected amount: <ECAmount amount={targetAmount} /></li>
                <li>From address: <AccountLink address={userAddress} /></li>
                <li>To address: <ContractLink address={EC_SWAP_ADDRESS} /></li>
              </ul>
              <p className="mt-2 text-sm italic">Make sure you sent the transaction to the correct address and it was included in the blockchain</p>
            </>
          );
          setStepFailure(STEP_ID.CHECK_TX);
          props.onStatusChange?.('failure');
          setIsChecking(false);
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
          }
          return;
        }

        // Schedule next check
        checkTimeoutRef.current = setTimeout(checkTransactions, CHECK_INTERVAL);
      } catch (error) {
        console.error('Failed to check transactions:', error);
        setErrorDetails(
          <>
            <p className="font-semibold">Transaction check failed:</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Error: {error instanceof Error ? error.message : 'Unknown error'}</li>
              <li>Contract: <ContractLink address={EC_SWAP_ADDRESS} /></li>
              <li>Status: {isChecking ? 'Checking' : 'Not checking'}</li>
            </ul>
            <p className="mt-2 text-sm italic">This is usually a temporary error, please try again. If the error persists, make sure your wallet supports native EC transfers</p>
          </>
        );
        setStepFailure(STEP_ID.CHECK_TX);
        props.onStatusChange?.('failure');
        setIsChecking(false);
      }
    };

    checkTransactions();

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [isChecking, userAddress, startLt, targetAmount]);

  /**
   * Effect to update step details when relevant state changes
   */
  useEffect(() => {
    updateStepDetails(STEP_ID.CALCULATE_AMOUNT, renderCalculateAmountContent());
    updateStepDetails(STEP_ID.SEND_EC, renderSendEcContent());
    updateStepDetails(STEP_ID.CHECK_TX, renderCheckTxContent());
  }, [props.testCase.status, targetAmount, userAddress, foundTxHash, errorDetails]);

  return (
    <BaseTestCase {...props}>
      <div className="flex flex-col">
        <TestStepsList steps={steps} />
      </div>
    </BaseTestCase>
  );
} 