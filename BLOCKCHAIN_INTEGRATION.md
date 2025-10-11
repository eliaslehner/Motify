# Blockchain Integration Guide

## Overview
Your Motify app is now fully integrated with the smart contract at `0x4975e988d05ec47a026b50a52907eb4558d2551d` on Base chain.

## What Was Implemented

### 1. Contract Configuration (`src/contract.ts`)
- Centralized contract address and ABI
- Easy to update if contract changes
- Type-safe exports for TypeScript

### 2. CreateChallenge Component Updates

#### Smart Contract Integration
When a user creates a challenge, the app now:

1. **Validates Input**
   - Ensures wallet is connected
   - Validates dates (start must be in future, end after start)
   - Validates wager amount (minimum 0.001 ETH)
   - Validates beneficiary address

2. **Calls Smart Contract**
   ```typescript
   writeContract({
     address: CONTRACT_ADDRESS,
     abi: MOTIFY_ABI,
     functionName: "createChallenge",
     args: [charityAddress, endTimeTimestamp]
   })
   ```

3. **Transaction Flow**
   - User clicks "Create Challenge"
   - Button shows "Confirm in Wallet..."
   - User approves transaction in wallet
   - Button shows "Confirming Transaction..."
   - Once confirmed, saves to backend database
   - Navigates to home page

### 3. ChallengeDetail Component Updates - **NEW**

#### Join Challenge (Blockchain Integration)
When a user joins a challenge:

1. **Validates Input**
   - Ensures wallet is connected
   - Validates stake amount (minimum 0.001 ETH)
   - Validates challenge is still active

2. **Calls Smart Contract with ETH**
   ```typescript
   writeContract({
     address: CONTRACT_ADDRESS,
     abi: MOTIFY_ABI,
     functionName: "joinChallenge",
     args: [challengeId],
     value: parseEther(amount) // Sends ETH with transaction
   })
   ```

3. **Transaction Flow**
   - User clicks "Join Challenge"
   - Dialog opens to enter stake amount
   - User clicks "Confirm and Join"
   - Button shows "Confirm in Wallet..."
   - User approves transaction in wallet (including ETH transfer)
   - Button shows "Confirming..."
   - Once confirmed, saves participation to backend
   - Updates UI to show participation status

#### Claim Refund (Winner or Timeout)
When a user can claim their funds:

1. **Reads Participant Status**
   - Uses `getParticipantInfo` to check on-chain status
   - Displays: stake amount, status (Pending/Winner/Loser)

2. **Claim Conditions**
   - **Winner**: Challenge ended and declared as winner
   - **Timeout**: 7 days passed after challenge end without results declared
   - Shows appropriate button text based on reason

3. **Calls Smart Contract**
   ```typescript
   writeContract({
     address: CONTRACT_ADDRESS,
     abi: MOTIFY_ABI,
     functionName: "claim",
     args: [challengeId]
   })
   ```

4. **Transaction Flow**
   - User clicks "Claim Your Refund (Winner)" or "Claim Refund (Timeout)"
   - Button shows "Confirm in Wallet..."
   - User approves transaction
   - Button shows "Claiming..."
   - ETH is returned to user's wallet
   - UI updates to reflect claimed status

#### UI/UX Improvements
- **Join Dialog**:
  - Updated to show ETH amounts instead of USD
  - Real-time transaction status
  - Transaction hash display
  - Loading states during confirmation
  
- **Participation Card**:
  - Shows off-chain stake amount (USD)
  - Shows on-chain stake amount (ETH)
  - Shows blockchain status (Pending/Winner/Loser)
  
- **Claim Button**:
  - Only appears when user can claim
  - Different text for winner vs timeout scenarios
  - Disabled during transaction processing
  - Shows transaction hash after submission

## How It Works

### Transaction States

#### Join Challenge
1. **isPending**: Waiting for user to approve in wallet
2. **isConfirming**: Transaction submitted to blockchain, waiting for confirmation
3. **isConfirmed**: Transaction confirmed, saving to backend
4. **error**: Transaction failed

#### Claim Refund
1. **isPending**: Waiting for user to approve claim in wallet
2. **isConfirming**: Claim transaction processing on blockchain
3. **isConfirmed**: ETH returned to wallet
4. **error**: Claim failed

### Reading Blockchain Data

The app uses `useReadContract` to fetch participant information:
```typescript
const { data: participantInfo } = useReadContract({
  address: CONTRACT_ADDRESS,
  abi: MOTIFY_ABI,
  functionName: 'getParticipantInfo',
  args: [challengeId, userAddress]
})
```

Returns:
- `participantInfo[0]`: Stake amount in Wei
- `participantInfo[1]`: Status (0=PENDING, 1=WINNER, 2=LOSER)

## Testing

### Test Join Challenge
1. Navigate to any active challenge
2. Click "Join Challenge"
3. Enter stake amount (minimum 0.001 ETH)
4. Click "Confirm and Join"
5. Approve transaction in wallet
6. Wait for confirmation
7. Verify:
   - Participation card shows your stake
   - On-chain status shows correct ETH amount
   - Backend updated with participation

### Test Claim Refund (Winner)
**Prerequisites**: Results must be declared by contract owner

1. Complete a challenge successfully
2. Wait for admin to call `declareResults` marking you as winner
3. Navigate to the challenge detail page
4. Click "Claim Your Refund (Winner)"
5. Approve transaction in wallet
6. Verify ETH returned to wallet

### Test Claim Refund (Timeout)
**Prerequisites**: 7 days must pass after challenge end without results

1. Join a challenge
2. Wait for challenge to end + 7 days
3. Navigate to the challenge detail page
4. Click "Claim Refund (Timeout)"
5. Approve transaction in wallet
6. Verify ETH returned to wallet

### Common Issues

**"Challenge ID not available"**
- Backend challenge ID may not match blockchain ID
- Current implementation assumes: `blockchainId = backendId - 1`
- You may need to store blockchain challenge ID in backend

**"Minimum stake amount is 0.001 ETH"**
- Contract requires minimum 0.001 ETH
- Ensure input meets this requirement

**"Transaction failed" during join**
- Check user has enough ETH for stake + gas
- Verify challenge hasn't ended
- Ensure user hasn't already joined

**"Claim conditions not met"**
- User must be marked as WINNER, or
- 7 days must have passed after challenge end
- Check participant status on blockchain

**Claim button doesn't appear**
- Ensure challenge data is loaded
- Verify participant info is fetched from blockchain
- Check user has funds to claim (amount > 0)

## Contract Status Enum

From the Solidity contract:
```solidity
enum Status {
    PENDING,  // 0 - Waiting for results
    WINNER,   // 1 - Can claim refund
    LOSER     // 2 - Funds go to charity
}
```

## Next Steps

### Recommended Improvements

1. **Store Blockchain Challenge ID**
   - When creating challenge, store returned challengeId from contract
   - Save to backend database
   - Use exact blockchain ID instead of assumption

2. **Real-time Status Updates**
   - Listen to contract events
   - Auto-update UI when results declared
   - Show notifications for status changes

3. **Challenge Creator Dashboard**
   - View created challenges
   - See participation stats
   - Track challenge lifecycle

4. **Admin Functions**
   - Interface for `declareResults`
   - List of pending challenges
   - Batch processing for multiple users

5. **Enhanced Participant Info**
   - Show who are winners/losers after results
   - Display charity donation amounts
   - Track total donations per challenge

6. **Losers - Process Donation**
   - Add UI for processing donations
   - Anyone can call `processDonation` for losers
   - Track which donations have been processed

## Contract Functions Status

From your contract ABI:

- ✅ `createChallenge(address _charity, uint256 _endTime)` - **IMPLEMENTED**
- ✅ `joinChallenge(uint256 _challengeId) payable` - **IMPLEMENTED**
- ✅ `claim(uint256 _challengeId)` - **IMPLEMENTED**
- ✅ `getParticipantInfo(uint256 _challengeId, address _user)` - **IMPLEMENTED (read-only)**
- ⏳ `declareResults(uint256 _challengeId, address[] _winners, address[] _losers)` - Admin only, needs UI
- ⏳ `processDonation(uint256 _challengeId, address _loser)` - Needs implementation
- ⏳ `withdrawFees(address _to)` - Admin only

## Important Notes

### Challenge ID Mapping
The current implementation assumes:
```typescript
blockchainChallengeId = backendChallengeId - 1
```

**Recommendation**: Update your backend to store the blockchain challenge ID when created:
1. After calling `createChallenge` on contract, it returns the challengeId
2. Store this in your database
3. Use exact blockchain ID for all contract interactions

### Gas Considerations
- Creating challenge: ~150,000 gas
- Joining challenge: ~100,000 gas  
- Claiming refund: ~50,000 gas
- Gas prices vary on Base network

### Security Notes
- Users can only claim their own funds
- Contract enforces timeout protection (7 days)
- Owner cannot steal user funds
- All state changes are logged as events

## Resources

- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)
- [OnchainKit Documentation](https://onchainkit.xyz/)
- [Base Chain Documentation](https://docs.base.org/)
- [Contract on BaseScan](https://basescan.org/address/0x4975e988d05ec47a026b50a52907eb4558d2551d)
