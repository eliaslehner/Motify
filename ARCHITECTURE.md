# Component Architecture

## App Structure

```
┌─────────────────────────────────────────────────────────────┐
│                         main.tsx                             │
│                    (Entry Point)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌────────────────────────────────────────────────────┐    │
│  │              OnchainProviders                       │    │
│  │  - WagmiProvider (Wallet connection)                │    │
│  │  - QueryClientProvider (Data caching)               │    │
│  │  - OnchainKitProvider (Base integration)            │    │
│  │                                                      │    │
│  │    ┌──────────────────────────────────────────┐    │    │
│  │    │          AuthProvider                     │    │    │
│  │    │  - Farcaster user context                │    │    │
│  │    │  - Base Account wallet                   │    │    │
│  │    │  - Authentication state                  │    │    │
│  │    │                                           │    │    │
│  │    │    ┌──────────────────────────────┐     │    │    │
│  │    │    │      BrowserRouter            │     │    │    │
│  │    │    │                               │     │    │    │
│  │    │    │  ┌─────────────────────┐     │     │    │    │
│  │    │    │  │  Routes             │     │     │    │    │
│  │    │    │  │  - / → Home         │     │     │    │    │
│  │    │    │  │  - /profile         │     │     │    │    │
│  │    │    │  │  - /create          │     │     │    │    │
│  │    │    │  │  - /challenge/:id   │     │     │    │    │
│  │    │    │  └─────────────────────┘     │     │    │    │
│  │    │    └──────────────────────────────┘     │    │    │
│  │    └──────────────────────────────────────────┘    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌───────────────────────────────────────────────────────────────┐
│                    External Sources                            │
└───────────┬───────────────────────┬───────────────────────────┘
            │                       │
            ▼                       ▼
    ┌──────────────┐        ┌──────────────┐
    │   Farcaster  │        │ Base Account │
    │   Mini App   │        │     SDK      │
    │   Context    │        │              │
    └──────┬───────┘        └──────┬───────┘
           │                       │
           └───────┬───────────────┘
                   │
                   ▼
        ┌────────────────────┐
        │   AuthContext      │
        │                    │
        │  State:            │
        │  - user            │
        │  - wallet          │
        │  - isAuthenticated │
        │  - isLoading       │
        └─────────┬──────────┘
                  │
                  │ (useAuth hook)
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐   ┌─────────┐   ┌──────────┐
│  Home  │   │ Profile │   │  Create  │
│  Page  │   │  Page   │   │Challenge │
└────────┘   └─────────┘   └──────────┘
    │             │             │
    │             │             │
    ▼             ▼             ▼
┌──────────────────────────────────┐
│        API Service               │
│                                  │
│  - getChallenges()               │
│  - getUserChallenges()           │
│  - getUserStats()                │
│  - getUserActivity()             │
│  - createChallenge()             │
│  - joinChallenge()               │
└──────────┬───────────────────────┘
           │
           │ (Future)
           ▼
    ┌──────────────┐
    │   Backend    │
    │   Database   │
    └──────────────┘
```

## Hook Dependencies

```
Component
    │
    ├── useAuth()
    │   └── AuthContext
    │       ├── sdk.context (Farcaster)
    │       └── Base Account SDK
    │
    ├── useWallet()
    │   ├── useAccount() (Wagmi)
    │   └── useAuth()
    │
    └── useState/useEffect
        └── apiService
            └── fetch() → Backend
```

## State Management

```
┌─────────────────────────────────────────────┐
│              Global State                    │
│                                              │
│  AuthContext (React Context)                │
│  ├── user: UserData | null                  │
│  │   ├── fid                                │
│  │   ├── username                           │
│  │   ├── displayName                        │
│  │   └── pfpUrl                             │
│  │                                           │
│  ├── wallet: WalletData | null              │
│  │   ├── address                            │
│  │   ├── balance                            │
│  │   └── isConnected                        │
│  │                                           │
│  └── methods:                                │
│      ├── connectWallet()                     │
│      └── disconnect()                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            Local State (Pages)               │
│                                              │
│  Home                                        │
│  ├── allChallenges: Challenge[]             │
│  ├── userChallenges: Challenge[]            │
│  └── loadingChallenges: boolean             │
│                                              │
│  Profile                                     │
│  ├── userStats: UserStats | null            │
│  ├── activities: Activity[]                 │
│  └── loadingData: boolean                   │
└─────────────────────────────────────────────┘
```

## API Service Pattern

```
┌────────────────────────────────────────────────┐
│              Component                          │
│                                                 │
│  useEffect(() => {                             │
│    async function loadData() {                 │
│      try {                                     │
│        const data = await apiService.get...() │
│        setState(data)                          │
│      } catch (error) {                         │
│        handleError(error)                      │
│      }                                          │
│    }                                            │
│    loadData()                                  │
│  }, [dependencies])                            │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│            apiService                           │
│                                                 │
│  async getChallenges() {                       │
│    const response = await fetch(API_URL)       │
│    return response.json()                      │
│  }                                              │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│          Backend API                            │
│                                                 │
│  GET  /challenges                              │
│  GET  /challenges/:id                          │
│  GET  /challenges/user/:address                │
│  POST /challenges                              │
│  POST /challenges/:id/join                     │
│  GET  /users/:address/stats                    │
│  GET  /users/:address/activity                 │
└────────────────────────────────────────────────┘
```

## Authentication Flow Detail

```
┌──────────────────────────────────────────────────────────┐
│ 1. App Mounts                                             │
└────┬─────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│ 2. AuthProvider useEffect triggers                        │
│    initializeAuth()                                       │
└────┬─────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│ 3. Get context from Farcaster SDK                         │
│    const context = await sdk.context                      │
└────┬─────────────────────────────────────────────────────┘
     │
     ├─── context?.user exists ────┐
     │                              │
     ▼                              ▼
┌─────────────────┐         ┌─────────────────┐
│ 4a. Set User    │         │ 4b. No User     │
│     Data        │         │     (Browser)   │
└────┬────────────┘         └─────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│ 5. connectWallet()                                        │
│    - Check for wallet in context.client                   │
│    - Extract address                                      │
└────┬─────────────────────────────────────────────────────┘
     │
     ├─── wallet found ────┐
     │                     │
     ▼                     ▼
┌──────────────┐    ┌──────────────┐
│ 6a. Set      │    │ 6b. No       │
│    Wallet    │    │    Wallet    │
│    Connected │    │    (Fallback)│
└──────┬───────┘    └──────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 7. isAuthenticated = true                                 │
│    Components can access user + wallet via useAuth()     │
└──────────────────────────────────────────────────────────┘
```

## Component Usage Pattern

```jsx
// Standard pattern for any component that needs auth

import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, wallet, isAuthenticated, isLoading } = useAuth();

  // 1. Handle loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 2. Handle unauthenticated state
  if (!isAuthenticated) {
    return <ConnectWalletPrompt />;
  }

  // 3. Render authenticated content
  return (
    <div>
      <h1>Welcome {user.displayName}</h1>
      <p>Wallet: {wallet.address}</p>
      {/* Your component content */}
    </div>
  );
}
```

## Future Additions (Ready to Add)

```
┌────────────────────────────────────────────────────────────┐
│         Smart Contract Integration (Future)                 │
│                                                             │
│  import { useWriteContract } from 'wagmi';                 │
│                                                             │
│  function CreateChallenge() {                              │
│    const { writeContract } = useWriteContract();           │
│    const { address } = useWallet();                        │
│                                                             │
│    const handleCreate = () => {                            │
│      writeContract({                                       │
│        address: CONTRACT_ADDRESS,                          │
│        abi: CHALLENGE_ABI,                                 │
│        functionName: 'createChallenge',                    │
│        args: [title, stake, endDate, beneficiary]          │
│      });                                                    │
│    };                                                       │
│  }                                                          │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│         Paymaster Service (Gas Sponsorship)                 │
│                                                             │
│  import { useCapabilities } from 'wagmi/experimental';     │
│                                                             │
│  const capabilities = useMemo(() => {                      │
│    if (availableCapabilities?.paymasterService) {          │
│      return {                                              │
│        paymasterService: {                                 │
│          url: PAYMASTER_URL                                │
│        }                                                    │
│      };                                                     │
│    }                                                        │
│    return {};                                              │
│  }, [availableCapabilities]);                              │
└────────────────────────────────────────────────────────────┘
```
