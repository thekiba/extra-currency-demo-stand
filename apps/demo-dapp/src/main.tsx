import './polyfills'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { TonConnectUIProvider, THEME, enableQaMode } from '@tonconnect/ui-react'

if (import.meta.env.VITE_QA_MODE === 'enable') {
  enableQaMode();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider
      manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json"
      uiPreferences={{ theme: THEME.DARK }}
    >
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
) 
