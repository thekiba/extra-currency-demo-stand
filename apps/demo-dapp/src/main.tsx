import './polyfills'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { TonConnectUIProvider, THEME } from '@tonconnect/ui-react'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider
      manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json" 
      uiPreferences={{ theme: THEME.DARK }}
      walletsListConfiguration={{
        includeWallets: [
          {
            appName: 'Tonkeeper',
            name: 'TonkeeperWeb',
            imageUrl: 'https://raw.githubusercontent.com/tonkeeper/tonkeeper-web/0f197474c57937787608697e794ef2b20a62f0d4/apps/twa/public/logo-128x128.png',
            aboutUrl: 'https://wallet.tonkeeper.com/',
            universalLink: 'https://wallet.tonkeeper.com/ton-connect',
            bridgeUrl: "https://bridge.tonapi.io/bridge",
            platforms: ["ios", "android", "macos", "windows", "linux"]
          },
          {
            name: 'TonDevWallet',
            appName: 'tondevwallet',
            aboutUrl: 'https://github.com/tondevwallet/tondevwallet',
            bridgeUrl: 'https://bridge.tonapi.io/bridge',
            deepLink: 'tondevwallet://connect/',
            imageUrl:
              'https://raw.githubusercontent.com/TonDevWallet/TonDevWallet/main/src-tauri/icons/Square284x284Logo.png',
            universalLink: 'tondevwallet://connect/',
            platforms: [
              'windows',
              'android',
              'ios',
              'chrome',
              'firefox',
              'linux',
              'macos',
              'safari',
            ],
          }
        ]
      }}
    >
      <App />
    </TonConnectUIProvider>
  </React.StrictMode>,
) 