export type TestStatus = 'pending' | 'running' | 'success' | 'failure';
export type TestType = 'check' | 'prompt' | 'error';

export interface TestCase {
  id: string;
  title: string;
  description: string;
  type: TestType;
  status: TestStatus;
  isOptional?: boolean;
  isEmulationRequired?: boolean;
  retryable?: boolean;
  timeoutSeconds?: number;
  dependencies?: string[];
}

export interface TestGroup {
  id: string;
  title: string;
  description: string;
  cases: TestCase[];
} 