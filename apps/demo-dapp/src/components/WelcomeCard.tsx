import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WelcomeCard() {
  return (
    <Card className="mx-auto mb-8">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl">Welcome to Extra Currency Testing Stand</CardTitle>
        <CardDescription className="text-lg mt-2">
          Integration testing tool for TON wallet developers implementing Extra Currency support
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          <section>
            <h3 className="text-2xl font-semibold mb-4">Test Coverage</h3>
            <p className="text-muted-foreground mb-4">
              This testing stand validates your wallet's Extra Currency implementation against the TON Connect protocol requirements. It covers both TON Connect API integration and native wallet UI/UX requirements.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-card p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">TON Connect Support</h4>
                <p className="text-sm text-muted-foreground">
                  Checks if wallet correctly declares Extra Currency support in its features and handles EC transactions via TON Connect
                </p>
              </div>
              
              <div className="bg-card p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Wallet Interface</h4>
                <p className="text-sm text-muted-foreground">
                  Verifies that EC balances are displayed correctly and EC transactions show proper amount formatting in the wallet UI
                </p>
              </div>
              
              <div className="bg-card p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">EC Operations</h4>
                <p className="text-sm text-muted-foreground">
                  Tests sending EC via both TON Connect and native wallet interface, with proper fee handling and transaction structure
                </p>
              </div>
            </div>
          </section>

          <section className="bg-muted p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">Requirements</h3>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                The test suite requires a testnet wallet with TON Connect support. All tests are performed against the EC swap contract. Test results are saved between sessions.
              </p>
              
              <div className="bg-background p-4 rounded-lg border border-border">
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Testnet wallet with TON Connect v2 support</li>
                  <li>3.25 test TON minimum for EC operations</li>
                  <li>Extra Currency feature flag in wallet manifest</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
} 