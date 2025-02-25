import { TestCase, TestStatus } from "@/types/test-case";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, HelpCircle, Lock, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

/**
 * Props for the TestCaseRenderer component
 */
interface TestCaseRendererProps {
  /** The test case to render */
  testCase: TestCase;
  /** Whether the test case is locked and cannot be interacted with */
  isLocked?: boolean;
  /** Callback triggered when the test status changes */
  onStatusChange?: (status: TestStatus) => void;
  /** Content to render inside the expandable section of the test case */
  children?: React.ReactNode;
}

/**
 * Component that renders a test case with its status, description, and expandable content
 */
export function TestCaseRenderer({ 
  testCase, 
  isLocked = false,
  children
}: TestCaseRendererProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Derived states for readability
  const isCompleted = testCase.status === 'success';
  const isFailed = testCase.status === 'failure';
  const isRunning = testCase.status === 'running';
  const isPending = testCase.status === 'pending';
  const isInteractive = isCompleted || isFailed;

  /**
   * Handle automatic collapse of successful test cases after a delay
   * and ensure expansion for running, pending, or failed test cases
   */
  useEffect(() => {
    if (isCompleted) {
      const collapseTimer = setTimeout(() => setIsExpanded(false), 2000);
      return () => clearTimeout(collapseTimer);
    } else if (isPending || isRunning || isFailed) {
      setIsExpanded(true);
    }
  }, [isCompleted, isPending, isRunning, isFailed]);

  /**
   * Toggle the expanded state of the test case card
   */
  const handleToggleExpand = () => {
    if (isInteractive) {
      setIsExpanded(!isExpanded);
    }
  };

  /**
   * Renders the appropriate status icon based on test case state
   */
  const renderStatusIcon = (): React.ReactNode => {
    if (isLocked) return <Lock className="w-5 h-5 text-muted-foreground" />;
    
    switch (testCase.status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failure':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <HelpCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  /**
   * Renders the badge indicators for test case attributes
   */
  const renderBadges = (): React.ReactNode => {
    return (
      <div className="flex gap-1">
        {testCase.isOptional && (
          <Badge variant="secondary" className="text-xs">Optional</Badge>
        )}
        {testCase.isEmulationRequired && (
          <Badge variant="outline" className="text-xs">Emulation</Badge>
        )}
        {testCase.type === 'check' && (
          <Badge className="bg-blue-500/10 text-blue-500 text-xs">Auto Check</Badge>
        )}
        {testCase.type === 'prompt' && (
          <Badge className="bg-orange-500/10 text-orange-500 text-xs">Manual Check</Badge>
        )}
      </div>
    );
  };

  /**
   * Renders the card header with title, description, and status
   */
  const renderCardHeader = (): React.ReactNode => {
    return (
      <CardHeader 
        className={`flex flex-row items-start justify-between p-4 ${isInteractive ? 'cursor-pointer' : ''}`}
        onClick={handleToggleExpand}
      >
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {testCase.title}
            </CardTitle>
            {renderBadges()}
          </div>
          <CardDescription className="text-sm">
            {testCase.description}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {renderStatusIcon()}
          {isInteractive && (
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
            />
          )}
        </div>
      </CardHeader>
    );
  };

  /**
   * Renders the expandable content section
   */
  const renderExpandableContent = (): React.ReactNode => {
    if (isLocked || !children) return null;
    
    return (
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <CardContent className="pt-0 pb-4 px-4">
          {children}
        </CardContent>
      </div>
    );
  };

  return (
    <Card className={`w-full transition-all duration-300 ${isLocked ? 'opacity-50' : 'hover:shadow-md'}`}>
      {renderCardHeader()}
      {renderExpandableContent()}
    </Card>
  );
} 