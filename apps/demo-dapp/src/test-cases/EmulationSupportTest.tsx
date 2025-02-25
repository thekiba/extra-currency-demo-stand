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
 * Default test steps for transaction emulation support test
 */
const DEFAULT_STEPS: TestStep[] = [
  {
    id: STEP_ID.CHECK_EMULATION,
    title: 'Transaction Emulation Support',
    description: 'Optional: Check if your wallet supports transaction preview',
    type: 'user-action',
    status: 'pending'
  }
];

/**
 * Component for testing whether wallet supports transaction emulation features
 */
export function EmulationSupportTest(props: BaseTestCaseProps) {
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
   * Handles user response to emulation support question
   * Updates test status based on whether the wallet supports transaction preview
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
   * Renders emulation feature description and instructions
   */
  const renderEmulationDescription = (): ReactNode => (
    <Alert>
      <AlertDescription className="space-y-2">
        <p>Does your wallet support transaction emulation?</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Shows preview of incoming/outgoing EC amounts before confirmation</li>
          <li>Displays expected TON excess for swap operations</li>
          <li>Allows reviewing transaction details before signing</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          Note: This is an optional feature. If your wallet doesn't support emulation, 
          the testing stand will use alternative verification methods.
        </p>
      </AlertDescription>
    </Alert>
  );

  /**
   * Renders success message when emulation is supported
   */
  const renderSuccessMessage = (): ReactNode => (
    <div className="text-sm text-green-600">
      ✓ Emulation support confirmed - additional preview tests will be included
    </div>
  );

  /**
   * Renders message for when emulation is not supported
   */
  const renderFailureMessage = (): ReactNode => (
    <div className="text-sm text-muted-foreground">
      Proceeding without emulation - standard verification will be used
    </div>
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
        {renderEmulationDescription()}
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