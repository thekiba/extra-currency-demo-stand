import { BaseTestCase, BaseTestCaseProps } from "./BaseTestCase";
import { useTonConnect } from "@/hooks/use-ton-connect";
import { useEffect, ReactNode } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code } from "@/components/ui/code";
import { TestStepsList } from "@/components/test-steps/TestStepsList";
import { useTestSteps } from "@/hooks/use-test-steps";
import { TestStep } from "@/types/test-steps";
import { TestStatus } from "@/types/test-case";

/**
 * Step identifiers used throughout the component
 */
const STEP_ID = {
  CHECK_SUPPORT: 'check-support'
} as const;

/**
 * Default test steps for Extra Currency support verification
 */
const DEFAULT_STEPS: TestStep[] = [
  {
    id: STEP_ID.CHECK_SUPPORT,
    title: 'Extra Currency Support',
    description: 'Check if wallet supports Extra Currency feature',
    type: 'auto-check',
    status: 'pending'
  }
];

/**
 * Component for testing whether wallet supports Extra Currency feature
 */
export function ExtraCurrencySupportTest(props: BaseTestCaseProps) {
  const { isConnected, hasExtraCurrencySupport, wallet } = useTonConnect();
  const { 
    steps, 
    updateStepDetails,
    setStepSuccess,
    setStepFailure,
    setStepPending
  } = useTestSteps({
    defaultSteps: DEFAULT_STEPS,
    testStatus: props.testCase.status
  });

  /**
   * Verifies if the wallet supports Extra Currency functionality
   * @returns Test status based on wallet's Extra Currency support
   */
  const checkExtraCurrencySupport = (): TestStatus => {
    if (!isConnected) {
      setStepPending(STEP_ID.CHECK_SUPPORT);
      return 'pending';
    }

    if (hasExtraCurrencySupport) {
      setStepSuccess(STEP_ID.CHECK_SUPPORT);
      return 'success';
    }

    setStepFailure(STEP_ID.CHECK_SUPPORT);
    return 'failure';
  };

  /**
   * Renders instructions for the Extra Currency support check
   */
  const renderInstructions = (): ReactNode => (
    <Alert>
      <AlertDescription>
        Checking if your wallet indicates Extra Currency support in its features.
        The wallet should provide <Code>extraCurrencySupported</Code> flag in <Code>SendTransaction</Code> feature.
      </AlertDescription>
    </Alert>
  );

  /**
   * Renders success message when wallet supports Extra Currency
   */
  const renderSuccessMessage = (): ReactNode => (
    <div className="text-sm text-green-600">
      ✓ Wallet correctly indicates Extra Currency support
    </div>
  );

  /**
   * Renders failure message when wallet doesn't support Extra Currency
   */
  const renderFailureMessage = (): ReactNode => (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-red-600">
        ✗ Wallet does not indicate Extra Currency support
      </div>
      <Code className="mt-2 block">
{`{
  name: 'SendTransaction',
  maxMessages: number,
  extraCurrencySupported: boolean
}`}
      </Code>
    </div>
  );

  /**
   * Renders the main content for the Extra Currency support check
   */
  const renderSupportCheckContent = (): ReactNode => (
    <div className="flex flex-col gap-4">
      {renderInstructions()}
      {props.testCase.status === 'success' && renderSuccessMessage()}
      {props.testCase.status === 'failure' && renderFailureMessage()}
    </div>
  );

  /**
   * Updates test status based on wallet's state
   */
  useEffect(() => {
    if (props.testCase.status === 'running' || props.testCase.status === 'pending') {
      const result = checkExtraCurrencySupport();
      props.onStatusChange?.(result);
    }

    if (props.testCase.status === 'failure') {
      if (hasExtraCurrencySupport) {
        setStepSuccess(STEP_ID.CHECK_SUPPORT);
        props.onStatusChange?.('success');
      } else if (isConnected) {
        setStepFailure(STEP_ID.CHECK_SUPPORT);
        props.onStatusChange?.('failure');
      }
    }
  }, [props.testCase.status, wallet, isConnected, hasExtraCurrencySupport, props.onStatusChange]);

  /**
   * Updates step content based on current test state
   */
  useEffect(() => {
    updateStepDetails(STEP_ID.CHECK_SUPPORT, renderSupportCheckContent());
  }, [props.testCase.status]);

  return (
    <BaseTestCase {...props}>
      <div className="flex flex-col">
        <TestStepsList steps={steps} />
      </div>
    </BaseTestCase>
  );
} 