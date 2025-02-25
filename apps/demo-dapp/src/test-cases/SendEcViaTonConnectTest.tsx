import { BaseTestCase, BaseTestCaseProps } from "./BaseTestCase";
import { useTonConnect } from "@/hooks/use-ton-connect";
import { useEffect, useState, useRef, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import { Address } from "@ton/ton";
import { getAccountState, getLastAccountTransactions } from "@/lib/ton-client";
import { useTonConnectUI } from '@tonconnect/ui-react';
import { TestStepsList } from "@/components/test-steps/TestStepsList";
import { useTestSteps } from "@/hooks/use-test-steps";
import { TestStep } from "@/types/test-steps";
import { AccountLink, ContractLink, TransactionLink } from "@/components/ton/links";
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
 * Default test steps for EC transfer via TON Connect
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
    description: 'Send Extra Currency using TON Connect',
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
 * Component for testing Extra Currency transfers via TON Connect
 */
export function SendEcViaTonConnectTest(props: BaseTestCaseProps) {
  const [tonConnectUI] = useTonConnectUI();
  const { userAddress, checkWalletFeatures } = useTonConnect();
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [foundTxHash, setFoundTxHash] = useState<string | null>(null);
  const [sentAmount, setSentAmount] = useState<bigint | null>(null);
  const [startLt, setStartLt] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ReactNode | null>(null);
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
   * @param address User's wallet address
   * @returns Random amount of EC to send (between 0.01 EC and 10% of balance)
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
            <li>Minimum required: <ECAmount amount={MIN_AMOUNT} /></li>
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
   * Initiates EC transfer via TON Connect
   */
  const handleSendEc = async () => {
    const walletFeatures = checkWalletFeatures();
    if (!walletFeatures.isConnected || !walletFeatures.userAddress) return;

    setLastTxHash(null);
    setErrorDetails(null);
    
    try {
      props.onStatusChange?.('running');

      const result = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 360, // 5 minutes from now
        messages: [
          {
            address: EC_SWAP_ADDRESS,
            amount: '0',
            extraCurrency: {
              [EC_TOKEN_ID]: sentAmount?.toString() ?? '0'
            }
          }
        ],
      });

      setLastTxHash(result.boc);
      startTimeRef.current = Date.now();
      setStepSuccess(STEP_ID.SEND_EC);
      updateStepsStatus([{ id: STEP_ID.CHECK_TX, status: 'pending' }]);
    } catch (error) {
      console.error('Failed to send transaction:', error);
      setErrorDetails(<>Failed to send transaction to the blockchain</>);
      setStepFailure(STEP_ID.SEND_EC);
      props.onStatusChange?.('failure');
    }
  };

  /**
   * Resets the test state to retry
   */
  const handleRetry = () => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    startTimeRef.current = null;
    setLastTxHash(null);
    setFoundTxHash(null);
    setSentAmount(null);
    setStartLt(null);
    setErrorDetails(null);
    props.onStatusChange?.('pending');
  };

  /**
   * Renders the content for the calculate amount step
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
      {typeof sentAmount === 'bigint' && (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-green-600">
            ✓ Amount calculated successfully
          </div>
          <div className="text-sm">
            Will send: <ECAmount amount={sentAmount} />
          </div>
        </div>
      )}
    </div>
  );

  /**
   * Renders the content for the send EC step
   */
  const renderSendEcContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Send <ECAmount amount={sentAmount} /> to the swap contract. This will trigger a transaction in your wallet.
        </AlertDescription>
      </Alert>
      {props.testCase.status === 'success' && (
        <div className="text-sm text-green-600">
          ✓ Transaction sent successfully
        </div>
      )}
      <div className="text-sm">
        Contract address: <ContractLink address={EC_SWAP_ADDRESS} />
      </div>
      {props.testCase.status === 'pending' && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEc}
            disabled={!userAddress}
            className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600"
          >
            Send <ECAmount amount={sentAmount} />
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
   * Renders the content for the transaction verification step
   */
  const renderCheckTxContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      <Alert>
        <AlertDescription>
          Verifying that your transaction was processed correctly. The transaction should:
          <ul className="list-disc list-inside mt-2">
            <li>Send exactly <ECAmount amount={sentAmount} /></li>
            <li>Not include any TON value</li>
            <li>Be sent to the correct contract <ContractLink address={EC_SWAP_ADDRESS} /></li>
          </ul>
        </AlertDescription>
      </Alert>
      {foundTxHash && (
        <div className="flex flex-col gap-2">
          <div className="text-sm text-green-600">
            ✓ Transaction found and verified
          </div>
          <TransactionLink hash={foundTxHash} />
        </div>
      )}
      {errorDetails && props.testCase.status === 'failure' && (
        <Alert variant="destructive" className="mt-4">
          <AlertDescription className="flex flex-col gap-2">
            <div>
              Failed to send Extra Currency:
              <div className="mt-2 text-sm bg-red-500/10 p-2 rounded">
                {errorDetails}
              </div>
            </div>
            {userAddress && <AccountLink address={userAddress} />}
            {typeof sentAmount === 'bigint' && (<div>Attempted to send: <ECAmount amount={sentAmount} /></div>)}
            <div className="flex flex-col gap-1">
              {foundTxHash && <TransactionLink hash={foundTxHash} />}
              <ContractLink address={EC_SWAP_ADDRESS} />
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  /**
   * Checks for transaction completion by monitoring the blockchain
   */
  const checkTransactions = async () => {
    const walletFeatures = checkWalletFeatures();
    if (!walletFeatures.userAddress || !sentAmount) return;

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
        if (!inMessage.info.src.equals(Address.parse(walletFeatures.userAddress))) return false;

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
          return;
        }

        const ecAmount = BigInt(inMessage.info.value.other?.get(EC_TOKEN_ID) ?? 0n);
        if (ecAmount !== sentAmount) {
          setErrorDetails(
            <>
              <p className="font-semibold">Amount validation error:</p>
              <ul className="list-disc pl-4 mt-2 space-y-1">
                <li>Expected: <ECAmount amount={sentAmount} /></li>
                <li>Found: <ECAmount amount={ecAmount} /></li>
              </ul>
            </>
          );
          setStepFailure(STEP_ID.CHECK_TX);
          props.onStatusChange?.('failure');
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
                <li>EC transfers should not include TON value</li>
              </ul>
            </>
          );
          setStepFailure(STEP_ID.CHECK_TX);
          props.onStatusChange?.('failure');
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
            </>
          );
          setStepFailure(STEP_ID.CHECK_TX);
          props.onStatusChange?.('failure');
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
            </>
          );
          setStepFailure(STEP_ID.CHECK_TX);
          props.onStatusChange?.('failure');
          return;
        }

        // Found a correct transaction
        setStepSuccess(STEP_ID.CHECK_TX);
        props.onStatusChange?.('success');
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
              <li>Expected amount: <ECAmount amount={sentAmount} /></li>
              <li>From address: <AccountLink address={userAddress} /></li>
              <li>To address: <ContractLink address={EC_SWAP_ADDRESS} /></li>
            </ul>
            <p className="mt-2 text-sm italic">Make sure your transaction was included in the blockchain</p>
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
      console.error('Failed to check transactions:', error);
      setErrorDetails(
        <>
          <p className="font-semibold">Transaction check failed:</p>
          <ul className="list-disc pl-4 mt-2 space-y-1">
            <li>Error: {error instanceof Error ? error.message : 'Unknown error'}</li>
            <li>Contract: <ContractLink address={EC_SWAP_ADDRESS} /></li>
          </ul>
          <p className="mt-2 text-sm italic">This is usually a temporary error, please try again</p>
        </>
      );
      setStepFailure(STEP_ID.CHECK_TX);
      props.onStatusChange?.('failure');
    }
  };

  /**
   * Effect to initialize calculation when test is pending
   */
  useEffect(() => {
    if (props.testCase.status === 'pending' && !sentAmount) {
      setStepRunning(STEP_ID.CALCULATE_AMOUNT);
      const walletFeatures = checkWalletFeatures();
      if (walletFeatures.userAddress) {
        getAccountState(Address.parse(EC_SWAP_ADDRESS))
          .then(account => {
            if (!account.account.last) {
              throw new Error('Swap account not found');
            }
            setStartLt(account.account.last.lt);

            return calculateRandomAmount(walletFeatures.userAddress)
          })
          .then(amount => {
            setSentAmount(amount);
            setStepSuccess(STEP_ID.CALCULATE_AMOUNT);
            updateStepsStatus([{ id: STEP_ID.SEND_EC, status: 'pending' }]);
          })
          .catch((error) => {
            console.error('Error calculating amount:', error);
            setStepFailure(STEP_ID.CALCULATE_AMOUNT);
          });
      }
    } else if (props.testCase.status === 'failure' && !sentAmount && !errorDetails) {
      handleRetry();
    } else if (sentAmount) {
      setStepSuccess(STEP_ID.CALCULATE_AMOUNT);
    }
  }, [props.testCase.status, userAddress, sentAmount]);

  /**
   * Effect to check transaction status when test is running
   */
  useEffect(() => {
    if (props.testCase.status === 'running' && !sentAmount) {
      props.onStatusChange?.('pending');
      return;
    }

    if (props.testCase.status !== 'running' || !lastTxHash || !sentAmount) return;

    // Start transaction checking process
    checkTransactions();

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
      }
    };
  }, [props.testCase.status, lastTxHash, userAddress, startLt, sentAmount]);

  /**
   * Effect to update step details based on current state
   */
  useEffect(() => {
    updateStepDetails(STEP_ID.CALCULATE_AMOUNT, renderCalculateAmountContent());
    updateStepDetails(STEP_ID.SEND_EC, renderSendEcContent());
    updateStepDetails(STEP_ID.CHECK_TX, renderCheckTxContent());
  }, [props.testCase.status, sentAmount, userAddress, foundTxHash, errorDetails]);

  return (
    <BaseTestCase {...props}>
      <div className="flex flex-col">
        <TestStepsList steps={steps} />
      </div>
    </BaseTestCase>
  );
} 