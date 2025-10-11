# Quick Start Guide - Join & Claim Features

## 🎯 Join a Challenge

### Step-by-Step

1. **Navigate to Challenge**
   ```
   Home → Click any active challenge card
   ```

2. **Click "Join Challenge" Button**
   - Only visible if you haven't joined yet
   - Only visible if challenge is still active

3. **Enter Stake Amount**
   - Dialog opens
   - Enter amount in ETH (minimum 0.001)
   - Example: `0.01` for a 0.01 ETH stake

4. **Confirm Transaction**
   - Click "Confirm and Join"
   - Button text changes to "Confirm in Wallet..."
   - Wallet popup appears

5. **Approve in Wallet**
   - Review the transaction details:
     - To: Contract address
     - Value: Your stake amount in ETH
     - Gas fee: Estimated
   - Click "Confirm" in wallet

6. **Wait for Confirmation**
   - Button shows "Confirming..."
   - Transaction is being mined (usually 2-5 seconds on Base)
   - Then shows "Saving..." while backend updates

7. **Success!**
   - Dialog closes
   - Participation card appears showing:
     - Off-chain stake (USD)
     - On-chain stake (ETH)
     - Status: "Pending"

### What Happens Behind the Scenes

```
Frontend                  Blockchain                Backend
   |                          |                        |
   |--joinChallenge tx------> |                        |
   |                          |                        |
   |                          |--[ETH transferred]     |
   |                          |                        |
   |<--tx confirmed-----------|                        |
   |                                                   |
   |--POST /challenges/:id/join------------------->   |
   |                                                   |
   |<--participation saved--------------------------  |
```

## 🏆 Claim Your Refund

### When Can You Claim?

**Scenario 1: You Won!** ✅
- Challenge has ended
- Admin declared results
- You were marked as a winner
- Button shows: "Claim Your Refund (Winner)"

**Scenario 2: Timeout Protection** ⏰
- Challenge ended more than 7 days ago
- Admin hasn't declared results
- Anyone can claim their stake back
- Button shows: "Claim Refund (Timeout)"

### Step-by-Step

1. **Check Your Status**
   - Navigate to challenge detail page
   - Look at participation card
   - If you see on-chain status as "Winner" OR challenge ended 7+ days ago
   - "Claim" button will appear

2. **Click Claim Button**
   - Button text varies based on reason
   - Shows transaction hash once submitted

3. **Approve in Wallet**
   - Button shows "Confirm in Wallet..."
   - Wallet popup appears
   - Review transaction (no ETH sent, just gas)
   - Click "Confirm"

4. **Wait for Confirmation**
   - Button shows "Claiming..."
   - Usually takes 2-5 seconds

5. **Success!**
   - ETH returned to your wallet
   - Transaction hash displayed
   - Participant info updates (amount becomes 0)

### What Happens Behind the Scenes

```
Frontend                  Blockchain                Your Wallet
   |                          |                        |
   |--claim tx--------------> |                        |
   |                          |                        |
   |                          |--[Validates status]    |
   |                          |--[Transfers ETH]-----> |
   |                          |                        |
   |<--tx confirmed-----------|                        |
```

## 📊 Understanding Your Status

### Participation Card Shows:

**Off-Chain Data (from backend):**
- `You're participating with $X staked`
- This is the USD value you entered

**On-Chain Data (from blockchain):**
- `On-chain stake: X.XXXX ETH`
  - Actual ETH locked in contract
  
- `Status: Pending/Winner/Loser`
  - **Pending**: Challenge ongoing or results not declared
  - **Winner**: You succeeded! Can claim refund
  - **Loser**: You failed. Funds go to charity

## 🚨 Common Issues & Solutions

### "Challenge ID not available"
**Problem**: Can't map backend challenge to blockchain challenge  
**Solution**: Contact admin or wait for fix

### "Minimum stake amount is 0.001 ETH"
**Problem**: Trying to stake less than minimum  
**Solution**: Enter at least 0.001 ETH

### "Transaction failed"
**Possible Causes**:
1. Not enough ETH in wallet (for stake + gas)
2. Challenge already ended
3. Already joined this challenge
4. Network congestion

**Solution**: Check wallet balance, verify challenge is active

### "Claim conditions not met"
**Problem**: Trying to claim when not eligible  
**Solution**: 
- Wait for admin to declare results, or
- Wait 7 days after challenge end (timeout protection)

### Claim button doesn't appear
**Problem**: Not eligible to claim yet  
**Check**:
- Is challenge ended?
- Has admin declared results?
- Are you marked as winner?
- OR has 7 days passed since end?

## 💡 Tips

### For Joining:
- ✅ Start small (0.001 ETH) for your first challenge
- ✅ Make sure you have extra ETH for gas fees
- ✅ Double-check the challenge end date
- ✅ Read challenge description carefully

### For Claiming:
- ✅ No rush - your funds are safe in the contract
- ✅ Claim when gas fees are low (check Base gas prices)
- ✅ Keep transaction hash for your records
- ✅ If you're a loser, funds automatically go to charity (admin processes)

## 📱 Mobile Wallet Tips

Using Coinbase Wallet on mobile:
1. Tap notification when transaction requires approval
2. Review details in wallet app
3. Swipe to confirm
4. Return to browser - transaction will auto-update

## 🔗 Useful Links

- **Contract Address**: `0x4975e988d05ec47a026b50a52907eb4558d2551d`
- **Network**: Base
- **View on BaseScan**: [basescan.org/address/0x4975e988d05ec47a026b50a52907eb4558d2551d](https://basescan.org/address/0x4975e988d05ec47a026b50a52907eb4558d2551d)
- **Check your transactions**: basescan.org → Search your wallet address

## 🎓 Example Workflow

### Complete Journey

1. **Create Challenge** (already implemented)
   - Set goal, dates, stake amount
   - Choose charity/beneficiary
   - Transaction creates challenge on-chain

2. **Join Challenge** (NEW!)
   - Find challenge on home page
   - Click to view details
   - Click "Join Challenge"
   - Enter stake in ETH
   - Approve transaction
   - ETH locked in contract

3. **Complete Challenge**
   - Track your progress daily
   - Work towards your goal
   - View progress on detail page

4. **Results Declared**
   - Admin reviews your progress
   - Calls `declareResults` on contract
   - You're marked as winner or loser

5. **Claim Refund** (NEW!)
   - If winner: claim your stake back
   - If loser: stake goes to charity
   - If no results after 7 days: claim via timeout

## ❓ FAQ

**Q: What if I lose?**  
A: Your stake goes to the charity/beneficiary you selected. Admin processes the donation.

**Q: What if the admin never declares results?**  
A: After 7 days, you can claim your stake back using the timeout protection feature.

**Q: Can I join multiple times?**  
A: No, each wallet can only join once per challenge.

**Q: Can I leave after joining?**  
A: No, your stake is locked until challenge ends. This is by design to ensure commitment.

**Q: What happens to the 0.5% fee?**  
A: Contract owner collects a 0.5% fee from loser stakes. This goes to contract maintenance.

**Q: How do I know the contract is safe?**  
A: Contract is verified on BaseScan. You can view the source code and see all transactions.

---

Need help? Check the full documentation in `BLOCKCHAIN_INTEGRATION.md` or `IMPLEMENTATION_SUMMARY.md`
