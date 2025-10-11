# Motify - Base Mini App Integration

## Overview

Motify is now integrated with Base Account SDK to automatically connect wallets when the mini app is launched from the Base app. The app uses real user data from the Farcaster context and Base Account smart wallets.

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Then add your OnchainKit API key:

```
VITE_ONCHAINKIT_API_KEY=your_api_key_here
```

You can get an API key from: https://portal.cdp.coinbase.com/

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Architecture

### Authentication Flow

1. **App Initialization** (`App.tsx`)
   - Wraps the app with `OnchainProviders` (Wagmi + OnchainKit)
   - Wraps with `AuthProvider` for authentication state management

2. **Auto-Connection** (`AuthContext.tsx`)
   - On mount, checks for Farcaster Mini App SDK context
   - Extracts user data (FID, username, display name, profile picture)
   - Automatically connects to Base Account smart wallet if available
   - Falls back gracefully if not in Base app environment

3. **User Data**
   - User profile data comes from Farcaster context
   - Wallet address comes from Base Account
   - All data is reactive and updates automatically

### Key Components

#### Context & Providers

- **`AuthContext`** (`src/contexts/AuthContext.tsx`)
  - Manages user authentication state
  - Handles wallet connection
  - Provides user and wallet data to the app

- **`OnchainProviders`** (`src/providers/OnchainProviders.tsx`)
  - Sets up Wagmi and OnchainKit
  - Configures Base chain connection
  - Provides blockchain interaction capabilities

#### Hooks

- **`useAuth()`** - Access user and wallet data
  ```tsx
  const { user, wallet, isAuthenticated, isLoading } = useAuth();
  ```

- **`useWallet()`** - Simplified wallet interactions
  ```tsx
  const { address, isConnected, connectWallet } = useWallet();
  ```

#### Components

- **`WalletStatus`** (`src/components/WalletStatus.tsx`)
  - Shows connection status
  - Displays user info when connected
  - Provides manual connect button as fallback

### API Service Layer

The `apiService` (`src/services/api.ts`) is set up for future backend integration:

```typescript
// Example usage
const challenges = await apiService.getChallenges();
const userStats = await apiService.getUserStats(address);
```

**Current State**: Returns mock data
**Future**: Replace with actual API calls to your backend

### Data Flow

1. **Challenges** - Loaded from API service (currently mock data)
2. **User Profile** - Loaded from Farcaster context + Base Account
3. **Stats** - Loaded from API service (currently mock data)
4. **Activities** - Loaded from API service (currently mock data)

## Usage in Components

### Getting User Data

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, wallet, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not connected</div>;

  return (
    <div>
      <p>Hello {user.displayName}</p>
      <p>Wallet: {wallet.address}</p>
    </div>
  );
}
```

### Loading Challenges

```tsx
import { useEffect, useState } from 'react';
import { apiService } from '@/services/api';

function ChallengeList() {
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    apiService.getChallenges().then(setChallenges);
  }, []);

  return <div>{/* render challenges */}</div>;
}
```

## Backend Integration (Next Steps)

To connect to your backend database:

1. **Update API Service** (`src/services/api.ts`)
   - Replace mock functions with actual fetch calls
   - Add authentication headers if needed
   - Handle error cases

2. **Example API Call**:
   ```typescript
   async getChallenges(): Promise<Challenge[]> {
     const response = await fetch(`${API_URL}/challenges`, {
       headers: {
         'Content-Type': 'application/json',
         // Add auth token if needed
       },
     });
     
     if (!response.ok) {
       throw new Error('Failed to fetch challenges');
     }
     
     return response.json();
   }
   ```

3. **Environment Variable**:
   ```
   VITE_API_URL=https://your-backend-api.com
   ```

## Testing

### In Base App

1. Deploy your mini app to a public URL
2. Update the manifest in `index.html`
3. Test in the Base mobile app

### Local Development

When testing locally (outside Base app):
- User data will not be available
- Wallet connection will need to be manual
- The app handles this gracefully with fallbacks

## Key Files Modified

- `src/App.tsx` - Added providers
- `src/contexts/AuthContext.tsx` - New authentication context
- `src/providers/OnchainProviders.tsx` - New OnchainKit setup
- `src/services/api.ts` - New API service layer
- `src/hooks/useWallet.ts` - New wallet hook
- `src/components/WalletStatus.tsx` - New status component
- `src/pages/Home.tsx` - Updated to use real data
- `src/pages/Profile.tsx` - Updated to use real data

## Important Notes

1. **No Hardcoded Data**: User profiles and wallet addresses are now dynamic
2. **Graceful Fallbacks**: App works both inside and outside Base app
3. **Ready for Backend**: API service layer is ready for your backend integration
4. **Type Safety**: All data structures are typed with TypeScript interfaces

## Next Steps

1. ✅ Base Account SDK integration
2. ✅ Automatic wallet connection
3. ✅ Real user data from Farcaster
4. ✅ API service layer structure
5. 🔄 Connect to your backend database
6. 🔄 Implement blockchain transactions
7. 🔄 Add smart contract interactions
8. 🔄 Implement challenge verification

## Support

For Base Account documentation: https://docs.base.org/base-account/
For OnchainKit documentation: https://onchainkit.xyz/
