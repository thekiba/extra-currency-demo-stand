import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestGroup as TestGroupType, TestCase, TestStatus } from "@/types/test-case";
import { FolderOpen, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { TestCaseFactory } from "@/test-cases/TestCaseFactory";
import { cn } from "@/lib/utils";

interface TestGroupProps {
  group: TestGroupType;
  allGroups: TestGroupType[];
  onTestAction: (testId: string, action: 'retry' | 'yes' | 'no') => void;
  onTestStatusChange: (testId: string, status: TestStatus) => void;
}

export function TestGroup({ group, allGroups, onTestStatusChange }: TestGroupProps) {
  const completedTests = group.cases.filter(test => test.status === 'success').length;
  const progress = (completedTests / group.cases.length) * 100;
  
  // Get all test cases from all groups
  const allTestCases = allGroups.flatMap(g => g.cases);
  
  // Check if all previous tests in dependencies are completed and ensure sequential execution
  const isTestLocked = (test: TestCase, index: number): boolean => {
    // If it's not the first test in the group, check if all previous tests in this group are completed
    if (index > 0) {
      const previousTests = group.cases.slice(0, index);
      const allPreviousCompleted = previousTests.every(t => 
        t.status === 'success' || 
        (t.isOptional && t.status === 'failure')
      );
      if (!allPreviousCompleted) return true;
    }

    // Then check specific dependencies across all groups
    if (!test.dependencies?.length) {
      return false;
    }

    const allDependenciesMet = test.dependencies.every(depId => 
      allTestCases.some(t => t.id === depId && (
        t.status === 'success' || 
        (t.isOptional && t.status === 'failure')
      ))
    );

    return !allDependenciesMet;
  };

  // Determine the border color based on test statuses
  const getBorderColorClass = (): string => {
    const failedTestCount = group.cases.filter(test => test.status === 'failure').length;
    const runningTestCount = group.cases.filter(test => test.status === 'running').length;
    const pendingTestCount = group.cases.filter(test => test.status === 'pending').length;
    const lockedTestCount = group.cases.filter((test, index) => isTestLocked(test, index)).length;
    
    if (completedTests === group.cases.length) {
      return "border-t-green-500"; // All tests passed
    } else if (failedTestCount > 0) {
      return "border-t-red-500"; // Some tests failed
    } else if (lockedTestCount === group.cases.length) {
      return "border-t-gray-500"; // All tests are locked
    } else if (runningTestCount > 0 || pendingTestCount > 0) {
      return "border-t-blue-500"; // Tests are running or waiting for user action
    } else {
      return "border-t-blue-500"; // Default color
    }
  };

  // Determine the icon color based on test statuses
  const getIconColorClass = (): string => {
    const failedTestCount = group.cases.filter(test => test.status === 'failure').length;
    const runningTestCount = group.cases.filter(test => test.status === 'running').length;
    const pendingTestCount = group.cases.filter(test => test.status === 'pending').length;
    const lockedTestCount = group.cases.filter((test, index) => isTestLocked(test, index)).length;
    
    if (completedTests === group.cases.length) {
      return "text-green-500"; // All tests passed
    } else if (failedTestCount > 0) {
      return "text-red-500"; // Some tests failed
    } else if (lockedTestCount === group.cases.length) {
      return "text-gray-500"; // All tests are locked
    } else if (runningTestCount > 0 || pendingTestCount > 0) {
      return "text-blue-500"; // Tests are running or waiting for user action
    } else {
      return "text-blue-500"; // Default color
    }
  };
  
  // Determine the progress bar color based on test statuses
  const getProgressColorClass = (): string => {
    const failedTestCount = group.cases.filter(test => test.status === 'failure').length;
    const runningTestCount = group.cases.filter(test => test.status === 'running').length;
    const pendingTestCount = group.cases.filter(test => test.status === 'pending').length;
    const lockedTestCount = group.cases.filter((test, index) => isTestLocked(test, index)).length;
    
    if (completedTests === group.cases.length) {
      return "bg-green-500"; // All tests passed
    } else if (failedTestCount > 0) {
      return "bg-red-500"; // Some tests failed
    } else if (lockedTestCount === group.cases.length) {
      return "bg-gray-500"; // All tests are locked
    } else if (runningTestCount > 0 || pendingTestCount > 0) {
      return "bg-blue-500"; // Tests are running or waiting for user action
    } else {
      return "bg-blue-500"; // Default color
    }
  };

  return (
    <Card className={cn("w-full mb-6 border-t-4", getBorderColorClass())}>
      <CardHeader className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FolderOpen className={cn("w-5 h-5", getIconColorClass())} />
            <CardTitle className="text-xl">{group.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="w-4 h-4" />
            <span>{completedTests} of {group.cases.length} completed</span>
          </div>
        </div>
        <CardDescription className="text-base">{group.description}</CardDescription>
        <Progress 
          value={progress} 
          className="h-2 mt-4"
          indicatorColor={getProgressColorClass()}
        />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-4">
          {group.cases.map((testCase, index) => {
            const locked = isTestLocked(testCase, index);
            return (
              <TestCaseFactory
                key={testCase.id}
                testCase={testCase}
                isLocked={locked}
                testId={testCase.id}
                onStatusChange={onTestStatusChange}
              />
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 