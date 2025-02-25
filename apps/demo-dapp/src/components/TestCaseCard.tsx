import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TestCase } from "@/types/test-case";
import { CheckCircle, XCircle, Loader2, HelpCircle, Lock, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTonConnect } from "@/hooks/use-ton-connect";
import { useEffect } from "react";

interface TestCaseCardProps {
  testCase: TestCase;
  onRetry?: () => void;
  onYes?: () => void;
  onNo?: () => void;
  isLocked?: boolean;
  onStatusChange?: (status: 'running' | 'success' | 'failure') => void;
}

export function TestCaseCard({ 
  testCase, 
  onRetry, 
  onYes, 
  onNo, 
  isLocked = false,
  onStatusChange 
}: TestCaseCardProps) {
  const { connect, isConnected, hasExtraCurrencySupport, wallet } = useTonConnect();

  // Handle wallet connection test cases
  useEffect(() => {
    if (testCase.status !== 'running') return;

    if (testCase.id === 'connect-wallet') {
      if (isConnected) {
        onStatusChange?.('success');
      }
    }

    if (testCase.id === 'ec-support') {
      if (hasExtraCurrencySupport) {
        onStatusChange?.('success');
      } else if (isConnected) {
        onStatusChange?.('failure');
      }
    }
  }, [testCase.id, testCase.status, wallet, isConnected, hasExtraCurrencySupport, onStatusChange]);

  const StatusIcon = () => {
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

  // Custom action buttons for specific test cases
  const renderCustomActions = () => {
    if (testCase.id === 'connect-wallet' && !wallet) {
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            connect();
            onStatusChange?.('running');
          }}
          className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600"
        >
          <Wallet className="w-4 h-4 mr-2" />
          Connect Wallet
        </Button>
      );
    }
    return null;
  };

  return (
    <Card className={`w-full transition-all duration-200 ${isLocked ? 'opacity-50' : 'hover:shadow-md'}`}>
      <CardHeader className="flex flex-row items-start justify-between p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {testCase.title}
            </CardTitle>
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
          </div>
          <CardDescription className="text-sm">
            {testCase.description}
          </CardDescription>
        </div>
        <StatusIcon />
      </CardHeader>

      {!isLocked && (
        <CardContent className="pt-0 pb-4 px-4">
          {renderCustomActions()}
          
          {testCase.type === 'prompt' && testCase.status === 'running' && (
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onYes}
                className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600"
              >
                Yes
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={onNo}
                className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600"
              >
                No
              </Button>
            </div>
          )}

          {testCase.status === 'failure' && testCase.retryable && (
            <div className="flex justify-end">
              <Button 
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600"
              >
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
} 