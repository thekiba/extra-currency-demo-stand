import { BaseTestCase, BaseTestCaseProps } from "./BaseTestCase";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";

/**
 * Action type identifiers to prevent typos and improve code maintainability
 */
const ACTION_TYPE = {
  PROMPT: 'prompt',
  CHECK: 'check'
} as const;

/**
 * Mock test case component used for simple prompt/check test cases
 * that don't require complex implementation
 */
export function MockTestCase(props: BaseTestCaseProps) {
  /**
   * Renders Yes/No prompt buttons for user confirmation
   */
  const renderPromptActions = (): ReactNode => (
    <div className="flex gap-2 justify-end">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => props.onStatusChange?.('success')}
        className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600"
      >
        Yes
      </Button>
      <Button 
        variant="outline"
        size="sm"
        onClick={() => props.onStatusChange?.('failure')}
        className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600"
      >
        No
      </Button>
    </div>
  );

  /**
   * Renders retry button and failure message for failed tests
   */
  const renderRetryAction = (): ReactNode => (
    <div className="flex justify-between items-center">
      <div className="flex items-center text-sm text-muted-foreground">
        <AlertCircle className="w-4 h-4 mr-2" />
        <span>This test is not yet implemented</span>
      </div>
      <Button 
        variant="outline"
        size="sm"
        onClick={() => props.onStatusChange?.('running')}
        className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600"
      >
        Retry
      </Button>
    </div>
  );

  /**
   * Renders start button for check-type tests
   */
  const renderStartCheckAction = (): ReactNode => (
    <div className="flex justify-end">
      <Button 
        variant="outline"
        size="sm"
        onClick={() => props.onStatusChange?.('running')}
        className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600"
      >
        Start Check
      </Button>
    </div>
  );

  /**
   * Determines which action UI to render based on test case state
   */
  const renderActions = (): ReactNode => {
    const { testCase } = props;

    // Prompt-type test in running state - show Yes/No buttons
    if (testCase.type === ACTION_TYPE.PROMPT && testCase.status === 'running') {
      return renderPromptActions();
    }

    // Failed test that can be retried - show retry button
    if (testCase.status === 'failure' && testCase.retryable) {
      return renderRetryAction();
    }

    // Check-type test in pending state - show start button
    if (testCase.type === ACTION_TYPE.CHECK && testCase.status === 'pending') {
      return renderStartCheckAction();
    }

    return null;
  };

  return (
    <BaseTestCase {...props}>
      {renderActions()}
    </BaseTestCase>
  );
} 