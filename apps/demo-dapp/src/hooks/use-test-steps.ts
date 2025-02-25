import { useState, useEffect } from "react";
import { TestStep, TestStepStatus } from "@/types/test-steps";
import { TestStatus } from "@/types/test-case";

/**
 * Options for initializing useTestSteps hook
 */
interface UseTestStepsOptions {
  /** Initial list of test steps */
  defaultSteps: TestStep[];
  /** Current status of the entire test */
  testStatus: TestStatus;
}

/**
 * Information for updating step status
 */
interface StepStatusUpdate {
  /** Step identifier */
  id: string;
  /** New step status */
  status: TestStepStatus;
}

/**
 * Hook for managing test steps
 * Provides functions for updating statuses and content of steps
 *
 * @param options Initialization options
 * @returns Set of functions for working with steps
 */
export function useTestSteps({
  defaultSteps,
  testStatus,
}: UseTestStepsOptions) {
  // Initialization of steps with correct statuses
  const [steps, setSteps] = useState<TestStep[]>(() =>
    defaultSteps.map((step, index) => ({
      ...step,
      status:
        testStatus === "success"
          ? "success"
          : index === 0
          ? "pending"
          : "locked",
    }))
  );

  // Reset steps when test status changes
  useEffect(() => {
    if (testStatus === "pending") {
      setSteps(
        defaultSteps.map((step, index) => ({
          ...step,
          status: index === 0 ? "pending" : "locked",
        }))
      );
    } else if (testStatus === "success") {
      setSteps(
        defaultSteps.map((step) => ({
          ...step,
          status: "success",
        }))
      );
    }
  }, [testStatus, defaultSteps]);

  /**
   * Updates statuses of multiple steps simultaneously
   * @param updates Array of step updates
   */
  const updateStepsStatus = (updates: StepStatusUpdate[]) => {
    setSteps((steps) =>
      steps.map((step) => {
        const update = updates.find((s) => s.id === step.id);
        if (update) {
          return { ...step, status: update.status };
        }
        return step;
      })
    );
  };

  /**
   * Updates status of a single step
   * @param id Step identifier
   * @param status New status
   */
  const updateStepStatus = (id: string, status: TestStepStatus) => {
    updateStepsStatus([{ id, status }]);
  };

  /**
   * Sets one status for all steps at once
   * @param status Status to set for all steps
   */
  const setAllStepsStatus = (status: TestStepStatus) => {
    setSteps((steps) => steps.map((step) => ({ ...step, status })));
  };

  /**
   * Updates step content
   * @param stepId Step identifier
   * @param details New content (React nodes)
   */
  const updateStepDetails = (stepId: string, details: React.ReactNode) => {
    setSteps((steps) =>
      steps.map((step) => (step.id === stepId ? { ...step, details } : step))
    );
  };

  // Helper functions for commonly used operations

  /**
   * Sets step status to "success"
   * @param id Step identifier
   */
  const setStepSuccess = (id: string) => {
    updateStepStatus(id, "success");
  };

  /**
   * Sets step status to "failure"
   * @param id Step identifier
   */
  const setStepFailure = (id: string) => {
    updateStepStatus(id, "failure");
  };

  /**
   * Sets step status to "pending"
   * @param id Step identifier
   */
  const setStepPending = (id: string) => {
    updateStepStatus(id, "pending");
  };

  /**
   * Sets step status to "running"
   * @param id Step identifier
   */
  const setStepRunning = (id: string) => {
    updateStepStatus(id, "running");
  };

  /**
   * Sets status of all steps to "success"
   */
  const setAllStepsSuccess = () => {
    setAllStepsStatus("success");
  };

  return {
    steps,
    setSteps,
    updateStepsStatus,
    updateStepStatus,
    setAllStepsStatus,
    updateStepDetails,
    setStepSuccess,
    setStepFailure,
    setStepPending,
    setStepRunning,
    setAllStepsSuccess,
  };
}
