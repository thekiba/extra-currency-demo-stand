import { ThemeProvider } from "@/components/theme-provider"
import { useState } from 'react'
import { Header } from '@/components/Header'
import { WelcomeCard } from '@/components/WelcomeCard'
import { TestGroup } from '@/components/TestGroup'
import { TestGroup as TestGroupType, TestStatus } from '@/types/test-case'
import { initialTestGroups } from '@/data/test-cases'
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckSquare, Trash2, CheckCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

function App() {
  const [testGroups, setTestGroups] = useState<TestGroupType[]>(() => {
    const savedSession = localStorage.getItem('test-session')
    return savedSession ? JSON.parse(savedSession) : initialTestGroups
  })

  const handleTestAction = (testId: string, action: 'retry' | 'yes' | 'no') => {
    setTestGroups(prevGroups => {
      const newGroups = prevGroups.map(group => ({
        ...group,
        cases: group.cases.map(testCase => {
          if (testCase.id === testId) {
            let newStatus: TestStatus
            switch (action) {
              case 'retry':
                newStatus = 'running'
                break
              case 'yes':
                newStatus = 'success'
                break
              case 'no':
                newStatus = 'failure'
                break
              default:
                return testCase
            }
            return { ...testCase, status: newStatus }
          }
          return testCase
        }),
      }))
      localStorage.setItem('test-session', JSON.stringify(newGroups))
      return newGroups
    })
  }

  const handleTestStatusChange = (testId: string, status: TestStatus) => {
    setTestGroups(prevGroups => {
      const newGroups = prevGroups.map(group => ({
        ...group,
        cases: group.cases.map(testCase => 
          testCase.id === testId 
            ? { ...testCase, status } 
            : testCase
        ),
      }))
      localStorage.setItem('test-session', JSON.stringify(newGroups))
      return newGroups
    })
  }

  const handleClearSession = () => {
    localStorage.removeItem('test-session')
    setTestGroups(initialTestGroups)
    // disconnect();
  }

  // Calculate total tests stats
  const totalTests = testGroups.reduce((acc, group) => acc + group.cases.length, 0);
  const completedTests = testGroups.reduce((acc, group) => acc + group.cases.filter(test => test.status === 'success').length, 0);
  const failedTests = testGroups.reduce((acc, group) => acc + group.cases.filter(test => test.status === 'failure').length, 0);
  const runningTests = testGroups.reduce((acc, group) => acc + group.cases.filter(test => test.status === 'running').length, 0);
  const pendingTests = testGroups.reduce((acc, group) => acc + group.cases.filter(test => test.status === 'pending').length, 0);
  const progress = (completedTests / totalTests) * 100;

  // Determine the border color based on overall test status
  const getBorderColorClass = (): string => {
    if (completedTests === totalTests) {
      return "border-t-green-500"; // All tests completed
    } else if (failedTests > 0) {
      return "border-t-red-500"; // Some tests failed
    } else if (runningTests > 0 || pendingTests > 0) {
      return "border-t-blue-500"; // Tests are running or waiting for user action
    } else {
      return "border-t-gray-500/20"; // Default state (maybe all tests are locked)
    }
  };

  // Determine icon color based on overall test status
  const getIconColorClass = (): string => {
    if (completedTests === totalTests) {
      return "text-green-500"; // All tests completed
    } else if (failedTests > 0) {
      return "text-red-500"; // Some tests failed
    } else if (runningTests > 0 || pendingTests > 0) {
      return "text-blue-500"; // Tests are running or waiting for user action
    } else {
      return "text-primary"; // Default state
    }
  };

  // Determine progress bar color based on overall test status
  const getProgressColorClass = (): string => {
    if (completedTests === totalTests) {
      return "bg-green-500"; // All tests completed
    } else if (failedTests > 0) {
      return "bg-red-500"; // Some tests failed
    } else if (runningTests > 0 || pendingTests > 0) {
      return "bg-blue-500"; // Tests are running or waiting for user action
    } else {
      return "bg-gray-500"; // Default state (maybe all tests are locked)
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <WelcomeCard />
          
          <div className="space-y-6">
            <Card className={cn("w-full border-t-4", getBorderColorClass())}>
              <CardHeader className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckSquare className={cn("w-5 h-5", getIconColorClass())} />
                    <CardTitle className="text-2xl">Test Cases</CardTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4" />
                      <span>{completedTests} of {totalTests} completed</span>
                    </div>
                    <button
                      onClick={handleClearSession}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Session
                    </button>
                  </div>
                </div>
                <CardDescription className="text-base">
                  Complete all test cases to verify your wallet's Extra Currency implementation
                </CardDescription>
                <Progress 
                  value={progress} 
                  className="h-2 mt-4"
                  indicatorColor={getProgressColorClass()}
                />
              </CardHeader>
            </Card>
            
            {testGroups.map(group => (
              <TestGroup
                key={group.id}
                group={group}
                allGroups={testGroups}
                onTestAction={handleTestAction}
                onTestStatusChange={handleTestStatusChange}
              />
            ))}
          </div>
        </main>
      </div>
    </ThemeProvider>
  )
}

export default App 