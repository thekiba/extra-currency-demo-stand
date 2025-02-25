import { TestCase, TestStatus } from "@/types/test-case";
import { TestCaseRenderer } from "./TestCaseRenderer";

/**
 * Props interface for the BaseTestCase component
 */
export interface BaseTestCaseProps {
  /** The test case configuration object */
  testCase: TestCase;
  /** Whether the test is locked and cannot be interacted with */
  isLocked?: boolean;
  /** Callback triggered when the test status changes */
  onStatusChange?: (status: TestStatus) => void;
  /** Optional child components to render inside the test case */
  children?: React.ReactNode;
}

/**
 * Base component for all test cases in the EC Testing Stand
 * 
 * This component serves as a wrapper around TestCaseRenderer and
 * provides a consistent interface for all test case implementations.
 * All specific test cases should extend this component.
 * 
 * @param testCase - The test case configuration
 * @param isLocked - Whether the test is locked and cannot be interacted with
 * @param onStatusChange - Callback for when test status changes
 * @param children - Optional child components to render inside the test case
 */
export function BaseTestCase({ 
  testCase, 
  isLocked, 
  onStatusChange,
  children 
}: BaseTestCaseProps) {
  return (
    <TestCaseRenderer
      testCase={testCase}
      isLocked={isLocked}
      onStatusChange={onStatusChange}
    >
      {children}
    </TestCaseRenderer>
  );
} 