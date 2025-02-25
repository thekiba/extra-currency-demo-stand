import { TonConnectButton } from '@tonconnect/ui-react';

export function Header() {
  return (
    <header className="border-b">
      <div className="px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Extra Currency Testing Stand</h1>
        <div className="flex items-center gap-4">
          <TonConnectButton />
        </div>
      </div>
    </header>
  );
} 