export type TestStepType = "user-action" | "wallet-action" | "auto-check";
export type TestStepStatus =
  | "pending"
  | "running"
  | "success"
  | "failure"
  | "locked";

export interface TestStep {
  id: string;
  title: string;
  description: string;
  type: TestStepType;
  status: TestStepStatus;
  details?: React.ReactNode;
}
