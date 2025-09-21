# LIFF and LineMiniDapp SDK Integration Guide

## 1. LIFF App Creation

### Step 1: Create LINE Channel
1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Create a new provider or select existing one
3. Create a new LINE Login channel
4. Configure channel settings:
   - **Channel name**: Your app name
   - **Channel description**: Your app description
   - **App types**: Web app
   - **Email address**: Your contact email

### Step 2: Create LIFF App
1. In your LINE Login channel, go to "LIFF" tab
2. Click "Add" to create new LIFF app
3. Configure LIFF settings:
   - **LIFF app name**: Your app name
   - **Size**: Choose appropriate size (Full, Tall, or Compact)
   - **Endpoint URL**: Your app URL (e.g., https://your-domain.com)
   - **Scope**: Select required permissions:
     - `profile` - Get user profile
     - `openid` - OpenID Connect
     - `email` - Get user email (optional)
   - **Bot link feature**: On/Off based on your needs

### Step 3: Secure Credential Management
After creation, you'll receive:
- **LIFF ID**: Used in client-side code (safe to expose)
- **Channel ID**: Keep secure
- **Channel Secret**: Server-side only (NEVER expose)
- **Channel Access Token**: Server-side only (NEVER expose)

#### Security Best Practices:
```bash
# Never commit .env files
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# Use environment variables
cp .env.example .env.local

# For production, use secure secret management:
# - Vercel: Environment Variables in Dashboard
# - AWS: Secrets Manager or Parameter Store
# - Azure: Key Vault
# - Google Cloud: Secret Manager
```

## 2. SDK Installation

### Install Required Packages:

```bash
# Using npm
npm install @line/liff@2.23.1 @line/liff-mini-dapp@1.0.0

# Using yarn
yarn add @line/liff@2.23.1 @line/liff-mini-dapp@1.0.0

# Install peer dependencies for Klaytn integration
npm install ethers@5.7.2 caver-js@1.11.1
# or
yarn add ethers@5.7.2 caver-js@1.11.1
```

### TypeScript Types (if using TypeScript):
```bash
npm install -D @types/line__liff
# or
yarn add -D @types/line__liff
```

## 3. LIFF Initialization

### Basic Initialization:
```javascript
import liff from '@line/liff';

// Initialize LIFF
liff.init({
  liffId: 'YOUR-LIFF-ID',
  withLoginOnExternalBrowser: true
})
.then(() => {
  console.log('LIFF initialized successfully');
  console.log('Version:', liff.getVersion());
  console.log('Language:', liff.getLanguage());
  console.log('Is in client:', liff.isInClient());
  console.log('Is logged in:', liff.isLoggedIn());
})
.catch((error) => {
  console.error('LIFF initialization failed:', error);
});
```

### Advanced Initialization with Callbacks:
```javascript
import { initializeLiff } from './services/liff/liffInitializer';

const initLiff = async () => {
  try {
    const liff = await initializeLiff({
      onSuccess: async (liffInstance) => {
        console.log('LIFF ready!');

        // Get user profile if logged in
        if (liffInstance.isLoggedIn()) {
          const profile = await liffInstance.getProfile();
          console.log('User:', profile.displayName);
        }
      },
      onError: (error) => {
        console.error('LIFF error:', error);
        // Show error UI to user
      },
      onAuthRequired: () => {
        console.log('User needs to login');
        // Show login button or redirect
      }
    });
  } catch (error) {
    console.error('Failed to initialize:', error);
  }
};

// Call on app mount
initLiff();
```

## 4. MiniDapp Initialization

### Basic MiniDapp Setup:
```javascript
import { MiniDapp } from '@line/liff-mini-dapp';

const initMiniDapp = async () => {
  // Ensure LIFF is initialized first
  if (!liff.isInitialized()) {
    throw new Error('Initialize LIFF first');
  }

  const miniDapp = new MiniDapp({
    liff,
    blockchain: {
      name: 'klaytn',
      chainId: 8217, // Klaytn mainnet
      rpcUrl: 'https://public-en-cypress.klaytn.net',
      nativeCurrency: {
        name: 'KLAY',
        symbol: 'KLAY',
        decimals: 18
      },
      blockExplorerUrl: 'https://scope.klaytn.com'
    },
    wallet: {
      enableProviders: ['line', 'kaikas', 'walletconnect'],
      autoConnect: true,
      preferredProvider: 'line'
    }
  });

  await miniDapp.ready();
  console.log('MiniDapp initialized!');

  return miniDapp;
};
```

### Advanced MiniDapp with Klaytn Integration:
```javascript
import { initializeMiniDapp, connectWallet } from './services/liff/miniDappInitializer';

const setupMiniDapp = async () => {
  try {
    const miniDapp = await initializeMiniDapp({
      onSuccess: async (instance) => {
        console.log('MiniDapp ready for Klaytn!');
      },
      onWalletConnected: (address) => {
        console.log('Wallet connected:', address);
        // Update UI with wallet info
      },
      onWalletDisconnected: () => {
        console.log('Wallet disconnected');
        // Update UI for disconnected state
      },
      onError: (error) => {
        console.error('MiniDapp error:', error);
      }
    });

    // Auto-connect if available
    if (miniDapp.isConnected()) {
      const address = miniDapp.getAccount();
      console.log('Already connected:', address);
    } else {
      // Connect wallet when user is ready
      const address = await connectWallet('line');
      console.log('Connected to:', address);
    }
  } catch (error) {
    console.error('Setup failed:', error);
  }
};
```

## 5. Environment Setup

### Development (.env.local):
```bash
NEXT_PUBLIC_LIFF_ID=1234567890-abcdefgh
LINE_CHANNEL_ACCESS_TOKEN=your-development-token
NEXT_PUBLIC_KLAYTN_RPC_URL=https://public-en-baobab.klaytn.net
NEXT_PUBLIC_KLAYTN_CHAIN_ID=1001
```

### Production (.env.production):
```bash
NEXT_PUBLIC_LIFF_ID=9876543210-zyxwvuts
LINE_CHANNEL_ACCESS_TOKEN=your-production-token
NEXT_PUBLIC_KLAYTN_RPC_URL=https://public-en-cypress.klaytn.net
NEXT_PUBLIC_KLAYTN_CHAIN_ID=8217
```

## 6. Testing Your Setup

### Test LIFF Initialization:
```javascript
// Test file: __tests__/liff.test.js
describe('LIFF Integration', () => {
  it('should initialize LIFF successfully', async () => {
    const liff = await initializeLiff();
    expect(liff).toBeDefined();
    expect(liff.isInitialized()).toBe(true);
  });

  it('should handle LIFF initialization errors', async () => {
    // Mock failed initialization
    await expect(initializeLiff()).rejects.toThrow();
  });
});
```

### Test MiniDapp Connection:
```javascript
describe('MiniDapp Klaytn Integration', () => {
  it('should connect to Klaytn network', async () => {
    const miniDapp = await initializeMiniDapp();
    expect(miniDapp.getBlockchain()).toBe('klaytn');
    expect(miniDapp.getChainId()).toBe(8217);
  });

  it('should connect wallet successfully', async () => {
    const address = await connectWallet();
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});
```

## 7. Common Issues and Solutions

### Issue 1: LIFF ID not found
**Solution**: Verify LIFF ID in LINE Developers Console and ensure it's correctly set in environment variables.

### Issue 2: CORS errors
**Solution**: Add your domain to LIFF endpoint URL whitelist in LINE Developers Console.

### Issue 3: Wallet connection fails
**Solution**: Ensure user has Kaikas wallet installed or LINE app with wallet feature enabled.

### Issue 4: Network mismatch
**Solution**: Verify chainId matches your intended Klaytn network (8217 for mainnet, 1001 for testnet).

## 8. Next Steps

1. Implement smart contract interactions
2. Set up transaction signing and sending
3. Implement LINE messaging features
4. Add social login with LINE profile
5. Set up webhook handlers for LINE events

For more information:
- [LINE LIFF Documentation](https://developers.line.biz/en/docs/liff/)
- [Klaytn Documentation](https://docs.klaytn.foundation/)
- [MiniDapp SDK Reference](https://developers.line.biz/en/docs/mini-app/)