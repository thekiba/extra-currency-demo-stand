import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TestStep, TestStepStatus, TestStepType } from "@/types/test-steps";

interface TestStepsListProps {
  steps: TestStep[];
}

const stepTypeBadges: Record<TestStepType, { className: string; label: string }> = {
  'user-action': {
    className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
    label: 'User Action'
  },
  'wallet-action': {
    className: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
    label: 'Wallet Action'
  },
  'auto-check': {
    className: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
    label: 'Auto Check'
  }
};

const stepStatusBadges: Record<TestStepStatus, { className: string; label: string }> = {
  'pending': {
    className: 'text-gray-600',
    label: 'Pending'
  },
  'locked': {
    className: 'text-gray-600',
    label: 'Locked'
  },
  'running': {
    className: 'text-blue-500 animate-pulse',
    label: 'In Progress'
  },
  'success': {
    className: 'text-green-500',
    label: 'Complete'
  },
  'failure': {
    className: 'text-red-500',
    label: 'Failed'
  }
};

export function TestStepsList({ steps }: TestStepsListProps) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      {steps.map((step, index) => (
        <div key={step.id} className={cn(
          "p-3 rounded-lg border",
          step.status === 'running' && "border-blue-500/50 bg-blue-500/5",
          step.status === 'success' && "border-green-500/50 bg-green-500/5",
          step.status === 'failure' && "border-red-500/50 bg-red-500/5",
          step.status === 'pending' && "",
          step.status === 'locked' && "opacity-50"
        )}>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">
              {index + 1}. {step.title}
            </span>
            <Badge 
              variant="outline" 
              className={cn("text-xs", stepTypeBadges[step.type].className)}
            >
              {stepTypeBadges[step.type].label}
            </Badge>
            <Badge 
              variant="outline" 
              className={cn("ml-2 text-xs", stepStatusBadges[step.status].className)}
            >
              {stepStatusBadges[step.status].label}
            </Badge>
          </div>
          <p className="text-sm text-gray-600">{step.description}</p>
          {step.details && (
            <div className="mt-2">
              {step.details}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 