# Implementation Summary - Join & Claim Features

## What Was Added

### 1. Join Challenge via Smart Contract
**File**: `src/pages/ChallengeDetail.tsx`

Users can now join challenges by staking ETH directly on the blockchain.

#### Key Features:
- **Payable Transaction**: Sends ETH with the `joinChallenge` call
- **Real-time Status**: Shows wallet approval, blockchain confirmation, and backend sync states
- **Validation**: Ensures minimum 0.001 ETH stake
- **UI Feedback**: Dialog with live transaction updates

#### Flow:
```
User clicks "Join Challenge" 
  → Opens dialog to enter stake amount (ETH)
  → User clicks "Confirm and Join"
  → Wallet popup for approval
  → ETH sent to contract
  → Transaction confirmed on blockchain
  → Participation saved to backend
  → UI updates with participation status
```

#### Code Added:
```typescript
// Wagmi hooks for joining
const { writeContract: joinContract, data: joinHash, isPending: joinIsPending } = useWriteContract();
const { isLoading: joinIsConfirming, isSuccess: joinIsConfirmed } = useWaitForTransactionReceipt({ hash: joinHash });

// Join function
joinContract({
  address: CONTRACT_ADDRESS,
  abi: MOTIFY_ABI,
  functionName: "joinChallenge",
  args: [BigInt(challengeId)],
  value: parseEther(amount) // Sends ETH!
});
```

### 2. Claim Refund (Winners & Timeout Protection)
**File**: `src/pages/ChallengeDetail.tsx`

Users can claim their stake back in two scenarios:
1. **Winner**: Challenge ended and they were declared winner
2. **Timeout**: 7 days passed after challenge end without results being declared

#### Key Features:
- **Reads On-Chain Status**: Uses `getParticipantInfo` to check eligibility
- **Displays Status**: Shows stake amount and status (Pending/Winner/Loser)
- **Smart Button**: Only appears when user can claim
- **Different Messages**: "Claim Your Refund (Winner)" vs "Claim Refund (Timeout)"

#### Flow:
```
User completes challenge successfully
  → Admin declares results (or timeout period passes)
  → User navigates to challenge detail
  → Sees on-chain status: "Winner" or sees timeout eligibility
  → "Claim Your Refund" button appears
  → User clicks button
  → Wallet popup for approval
  → ETH returned to user's wallet
  → UI updates to show claimed status
```

#### Code Added:
```typescript
// Read participant info from blockchain
const { data: participantInfo, refetch: refetchParticipantInfo } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: MOTIFY_ABI,
  functionName: 'getParticipantInfo',
  args: [challengeId, userAddress]
});

// Claim function
claimContract({
  address: CONTRACT_ADDRESS,
  abi: MOTIFY_ABI,
  functionName: "claim",
  args: [BigInt(challengeId)]
});

// participantInfo structure:
// [0] = stake amount in Wei (BigInt)
// [1] = status (0=PENDING, 1=WINNER, 2=LOSER)
```

## UI Changes

### Join Dialog
**Before**: Asked for USD amount, saved to backend only  
**After**: 
- Asks for ETH amount (minimum 0.001)
- Shows transaction states: "Confirm in Wallet...", "Confirming...", "Saving..."
- Displays transaction hash
- Disables button during processing

### Participation Card
**Before**: Only showed "You're participating with $X staked"  
**After**: 
- Shows off-chain stake (USD from backend)
- Shows on-chain stake (ETH from blockchain)
- Shows blockchain status (Pending/Winner/Loser)

### New: Claim Button
- Only visible when user has funds to claim
- Shows eligibility reason (Winner or Timeout)
- Real-time transaction feedback
- Displays claim transaction hash

## Important Implementation Details

### Challenge ID Mapping
**Current Assumption**:
```typescript
blockchainChallengeId = backendChallengeId - 1
```

This assumes:
- Backend IDs start at 1
- Blockchain IDs start at 0
- IDs are sequential

**⚠️ Recommendation**: Store the actual blockchain challenge ID in your backend when creating challenges.

### Status Enum (from Contract)
```solidity
enum Status {
    PENDING,  // 0 - Challenge ongoing, results not declared
    WINNER,   // 1 - User succeeded, can claim refund
    LOSER     // 2 - User failed, stake goes to charity
}
```

### Timeout Protection
- After challenge ends, admin has 7 days to declare results
- If no results declared after 7 days, anyone can claim their stake back
- This protects users from abandoned challenges

## Testing Checklist

### Test Join Challenge
- [ ] Navigate to active challenge detail page
- [ ] Click "Join Challenge" button
- [ ] Enter stake amount (try 0.001 ETH minimum)
- [ ] Click "Confirm and Join"
- [ ] Approve in wallet
- [ ] Verify transaction confirms
- [ ] Check participation card shows correct amounts
- [ ] Verify backend updated with participation

### Test Claim as Winner
**Prerequisites**: Need admin to call `declareResults` marking you as winner

- [ ] Complete a challenge successfully
- [ ] Wait for admin to declare results
- [ ] Navigate to challenge detail
- [ ] Verify on-chain status shows "Winner"
- [ ] Verify "Claim Your Refund (Winner)" button appears
- [ ] Click claim button
- [ ] Approve in wallet
- [ ] Verify ETH returned to wallet
- [ ] Check participantInfo updates (amount should be 0)

### Test Claim via Timeout
**Prerequisites**: Challenge must be ended + 7 days without results

- [ ] Join a test challenge
- [ ] Wait for challenge to end
- [ ] Wait 7 days (or adjust contract for testing)
- [ ] Navigate to challenge detail
- [ ] Verify "Claim Refund (Timeout)" button appears
- [ ] Click claim button
- [ ] Approve in wallet
- [ ] Verify ETH returned to wallet

## Error Scenarios Handled

1. **Wallet Not Connected**
   - Shows error toast
   - Prompts user to connect wallet

2. **Insufficient Funds**
   - Transaction fails at wallet level
   - User sees gas estimation error

3. **Already Joined**
   - Contract will reject the transaction
   - Error caught and displayed to user

4. **Challenge Ended**
   - Join button only shows if `challenge.active === true`
   - Contract enforces this as well

5. **Cannot Claim Yet**
   - Claim button only appears when eligible
   - Contract enforces claim conditions

6. **Transaction Failed**
   - Error caught and displayed
   - Button re-enabled for retry

## Gas Estimates

Based on typical Base network costs:

- **Join Challenge**: ~100,000 - 150,000 gas
- **Claim Refund**: ~50,000 - 80,000 gas
- **Gas Price**: Varies (typically 0.001-0.01 gwei on Base)

## Files Modified

1. **`src/pages/ChallengeDetail.tsx`**
   - Added join challenge blockchain integration
   - Added claim refund functionality
   - Added participant info reading
   - Updated UI with transaction states

2. **`src/contract.ts`** (already existed)
   - No changes needed
   - Used for contract address and ABI

3. **`BLOCKCHAIN_INTEGRATION.md`**
   - Updated with new features
   - Added comprehensive testing guide
   - Added troubleshooting section

## Next Steps (Optional Enhancements)

1. **Store Blockchain Challenge ID**
   - Modify backend to store the actual blockchain challenge ID
   - Update frontend to use stored ID instead of calculation

2. **Event Listening**
   - Listen for `JoinedChallenge` events
   - Auto-update UI when someone joins
   - Show notifications

3. **Admin Dashboard**
   - UI for calling `declareResults`
   - View all pending challenges
   - Batch declare results

4. **Process Donations**
   - Add UI for processing loser donations to charity
   - Show donation progress
   - Track total donated amounts

5. **Enhanced Status Display**
   - Show all participants with their blockchain status
   - Highlight winners/losers after results declared
   - Show who has claimed vs who hasn't

6. **Challenge History**
   - Show user's past claims
   - Display total earned from winning
   - Track donation impact from losing

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify wallet is connected to Base network
3. Ensure contract address is correct
4. Check transaction on BaseScan
5. Verify backend API is responding

Contract Address: `0x4975e988d05ec47a026b50a52907eb4558d2551d`  
Network: Base  
Block Explorer: https://basescan.org/address/0x4975e988d05ec47a026b50a52907eb4558d2551d
