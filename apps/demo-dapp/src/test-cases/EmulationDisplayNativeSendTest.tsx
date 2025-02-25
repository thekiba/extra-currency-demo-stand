import { BaseTestCase, BaseTestCaseProps } from "./BaseTestCase";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TestStepsList } from "@/components/test-steps/TestStepsList";
import { useTestSteps } from "@/hooks/use-test-steps";
import { TestStep } from "@/types/test-steps";
import { useEffect, ReactNode } from "react";

/**
 * Step identifiers used throughout the component
 */
const STEP_ID = {
  CHECK_EMULATION: 'check-emulation'
} as const;

/**
 * Default test steps for native EC transfer emulation display test
 */
const DEFAULT_STEPS: TestStep[] = [
  {
    id: STEP_ID.CHECK_EMULATION,
    title: 'Emulation Display',
    description: 'Verify that your wallet correctly displays the transaction preview for native EC transfer',
    type: 'user-action',
    status: 'pending'
  }
];

/**
 * Component for testing whether wallet correctly displays native EC transfer transaction preview
 */
export function EmulationDisplayNativeSendTest(props: BaseTestCaseProps) {
  const { 
    steps, 
    updateStepDetails,
    setStepSuccess,
    setStepFailure
  } = useTestSteps({
    defaultSteps: DEFAULT_STEPS,
    testStatus: props.testCase.status
  });

  /**
   * Handles user response to verification question
   * Updates test status based on whether the wallet's transaction preview was correct
   */
  const handleResponse = (correct: boolean) => {
    if (correct) {
      setStepSuccess(STEP_ID.CHECK_EMULATION);
    } else {
      setStepFailure(STEP_ID.CHECK_EMULATION);
    }
    props.onStatusChange?.(correct ? 'success' : 'failure');
  };

  /**
   * Renders verification instructions for the user
   */
  const renderVerificationInstructions = (): ReactNode => (
    <Alert>
      <AlertDescription className="space-y-2">
        <p>Please verify that your wallet's transaction preview correctly shows:</p>
        <ul className="list-disc pl-4 space-y-1 text-sm">
          <li>The exact amount of Extra Currency being sent</li>
          <li>The correct recipient address</li>
          <li>All transaction details and fees</li>
        </ul>
      </AlertDescription>
    </Alert>
  );

  /**
   * Renders success message when wallet properly displays transaction preview
   */
  const renderSuccessMessage = (): ReactNode => (
    <div className="text-sm text-green-600">
      ✓ Transaction preview displays correct native transfer details
    </div>
  );

  /**
   * Renders failure message when wallet doesn't properly display transaction preview
   */
  const renderFailureMessage = (): ReactNode => (
    <Alert variant="destructive" className="mt-4">
      <AlertDescription className="space-y-2">
        <p>Transaction preview verification failed:</p>
        <div className="mt-2 text-sm bg-red-500/10 p-4 rounded space-y-2">
          <p>The wallet's transaction preview is missing required information. Please ensure it shows:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>The exact amount of Extra Currency to be sent</li>
            <li>The complete recipient address</li>
            <li>All transaction details including fees</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );

  /**
   * Renders user verification controls (Yes/No buttons)
   */
  const renderVerificationControls = (): ReactNode => (
    <div className="flex gap-2 justify-end">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleResponse(true)}
        className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600"
      >
        <Check className="w-4 h-4 mr-2" />
        Yes
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleResponse(false)}
        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600"
      >
        <X className="w-4 h-4 mr-2" />
        No
      </Button>
    </div>
  );

  /**
   * Renders the main content for the emulation check step
   */
  const renderEmulationCheckContent = (): ReactNode => {
    return (
      <div className="flex flex-col gap-4">
        {renderVerificationInstructions()}
        {props.testCase.status === 'success' && renderSuccessMessage()}
        {props.testCase.status === 'failure' && renderFailureMessage()}
        {props.testCase.status === 'pending' && renderVerificationControls()}
      </div>
    );
  };

  /**
   * Updates step UI based on current test state
   */
  useEffect(() => {
    updateStepDetails(STEP_ID.CHECK_EMULATION, renderEmulationCheckContent());
  }, [props.testCase.status]);

  return (
    <BaseTestCase {...props}>
      <div className="flex flex-col">
        <TestStepsList steps={steps} />
      </div>
    </BaseTestCase>
  );
} 