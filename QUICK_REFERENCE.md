# Quick Reference: Base Account Authentication

## Authentication Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Opens Mini App                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  App.tsx Loads  │
                    └────────┬────────┘
                             │
                ┌────────────┴─────────────┐
                │                          │
                ▼                          ▼
       ┌─────────────────┐      ┌──────────────────┐
       │ OnchainProviders│      │   AuthProvider   │
       │   Initialize    │      │   Initialize     │
       └────────┬────────┘      └────────┬─────────┘
                │                        │
                │                        ▼
                │              ┌──────────────────────┐
                │              │ Farcaster SDK Check  │
                │              │ sdk.context          │
                │              └─────────┬────────────┘
                │                        │
                │            ┌───────────┴────────────┐
                │            │                        │
                │            ▼                        ▼
                │    ┌──────────────┐      ┌─────────────────┐
                │    │ User Found   │      │  No User Found  │
                │    │ Extract:     │      │  (Web Browser)  │
                │    │ - FID        │      └─────────────────┘
                │    │ - Username   │
                │    │ - Display    │
                │    │ - Avatar     │
                │    └──────┬───────┘
                │           │
                │           ▼
                │    ┌──────────────────┐
                │    │ Get Wallet from  │
                │    │ Base Account SDK │
                │    └──────┬───────────┘
                │           │
                │    ┌──────┴────────┐
                │    │               │
                │    ▼               ▼
                │ ┌────────┐   ┌─────────┐
                │ │Wallet  │   │   No    │
                │ │Found   │   │ Wallet  │
                │ └───┬────┘   └─────────┘
                │     │
                └─────┴──────────────────────┐
                                             │
                                             ▼
                                  ┌──────────────────┐
                                  │  App Renders     │
                                  │  with User Data  │
                                  └──────────────────┘
```

## Key Objects

### User Object
```typescript
{
  fid: number;              // Farcaster ID
  username: string;         // @username
  displayName: string;      // Display name
  pfpUrl: string;          // Profile picture URL
  bio?: string;            // User bio (if available)
}
```

### Wallet Object
```typescript
{
  address: string;         // 0x... wallet address
  balance?: string;        // Balance (optional)
  isConnected: boolean;    // Connection status
}
```

## useAuth() Hook Returns

```typescript
const {
  user,              // User object or null
  wallet,            // Wallet object or null
  isAuthenticated,   // boolean - true if both user and wallet connected
  isLoading,         // boolean - true during initialization
  connectWallet,     // function - manual wallet connection
  disconnect         // function - disconnect user
} = useAuth();
```

## Common Patterns

### Protected Component
```tsx
function ProtectedComponent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <ConnectWalletPrompt />;
  }

  return <YourComponent />;
}
```

### Display User Info
```tsx
function UserDisplay() {
  const { user, wallet } = useAuth();

  return (
    <div>
      <Avatar src={user?.pfpUrl} />
      <h2>{user?.displayName}</h2>
      <p>@{user?.username}</p>
      <p>{wallet?.address}</p>
    </div>
  );
}
```

### Load User-Specific Data
```tsx
function UserChallenges() {
  const { wallet } = useAuth();
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    if (wallet?.address) {
      apiService
        .getUserChallenges(wallet.address)
        .then(setChallenges);
    }
  }, [wallet?.address]);

  return <ChallengeList challenges={challenges} />;
}
```

## Environment Setup

### Required
```bash
VITE_ONCHAINKIT_API_KEY=your_key_here
```

### Optional (for backend)
```bash
VITE_API_URL=https://api.yourdomain.com
```

## Testing Scenarios

### In Base App (Production)
- ✅ User auto-populated from Farcaster
- ✅ Wallet auto-connected from Base Account
- ✅ No manual connection needed

### In Web Browser (Development)
- ❌ No user data (shows fallback UI)
- ❌ No automatic wallet connection
- ✅ Manual connect still works
- ✅ App doesn't crash, handles gracefully

## API Service Integration

### Current (Mock)
```typescript
const challenges = await apiService.getChallenges();
// Returns hardcoded mock data
```

### Future (Real Backend)
```typescript
// Update in src/services/api.ts
async getChallenges(): Promise<Challenge[]> {
  const response = await fetch(`${API_URL}/challenges`);
  return response.json();
}
```

## Wallet Interactions (Future)

When you're ready to add transactions:

```typescript
import { useWallet } from '@/hooks/useWallet';
import { useWriteContract } from 'wagmi';

function CreateChallengeButton() {
  const { address } = useWallet();
  const { writeContract } = useWriteContract();

  const handleCreate = () => {
    writeContract({
      address: '0xYourContractAddress',
      abi: yourABI,
      functionName: 'createChallenge',
      args: [/* your args */],
    });
  };

  return <button onClick={handleCreate}>Create</button>;
}
```

## Debugging

### Check if in Mini App context
```typescript
import { sdk } from '@farcaster/miniapp-sdk';

const context = await sdk.context;
console.log('Context:', context);
```

### Check wallet connection
```typescript
const { wallet, isAuthenticated } = useAuth();
console.log('Wallet:', wallet);
console.log('Authenticated:', isAuthenticated);
```

### Check user data
```typescript
const { user } = useAuth();
console.log('User:', user);
```

## Common Issues & Solutions

### Issue: User data not loading
- **Check**: Are you testing in Base app or web browser?
- **Solution**: User data only available when launched from Base app

### Issue: Wallet not connecting
- **Check**: Is Base Account SDK initialized?
- **Solution**: Check console for errors, ensure SDK is ready

### Issue: Data not updating
- **Check**: Are you using the `useAuth()` hook?
- **Solution**: Make sure components are wrapped in `AuthProvider`

### Issue: Type errors
- **Check**: Are you importing types from the right place?
- **Solution**: Import from `@/services/api` or `@/contexts/AuthContext`

## File Locations Quick Reference

```
src/
├── contexts/
│   └── AuthContext.tsx          # Main auth logic
├── providers/
│   └── OnchainProviders.tsx     # Blockchain providers
├── hooks/
│   └── useWallet.ts             # Wallet hook
├── services/
│   └── api.ts                   # API service (update this!)
├── components/
│   └── WalletStatus.tsx         # Connection status
└── pages/
    ├── Home.tsx                 # Uses real data
    └── Profile.tsx              # Uses real data
```
