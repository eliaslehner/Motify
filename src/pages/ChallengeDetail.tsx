// pages/ChallengeDetail.tsx
import { ArrowLeft, Calendar, DollarSign, Users, Trophy, Target, Loader2, TrendingUp, Heart, Wallet, Copy, CheckCircle2, ExternalLink, Share2, Check } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useComposeCast } from '@coinbase/onchainkit/minikit';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useState, useEffect } from "react";
import { getActivityTypeInfo } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { CONTRACTS, ABIS } from "@/contract";
import { parseUnits, formatUnits } from "viem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Contract data types
interface ContractChallenge {
  challengeId: bigint;
  recipient: string;
  startTime: bigint;
  endTime: bigint;
  isPrivate: boolean;
  name: string;
  apiType: string;
  goalType: string;
  goalAmount: bigint;
  description: string;
  totalDonationAmount: bigint;
  resultsFinalized: boolean;
  participants: Array<{
    participantAddress: string;
    initialAmount: bigint;
    amount: bigint;
    refundPercentage: bigint;
    resultDeclared: boolean;
  }>;
}

interface ContractParticipantInfo {
  participantAddress: string;
  initialAmount: bigint;
  amount: bigint;
  refundPercentage: bigint;
  resultDeclared: boolean;
}

// Helper functions for challenge status
function isChallengeActive(startTime: bigint, endTime: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return now >= startTime && now <= endTime;
}

function isChallengeCompleted(endTime: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return now > endTime;
}

function isChallengeUpcoming(startTime: bigint): boolean {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return now < startTime;
}

function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(startTime: bigint, endTime: bigint): string {
  const now = BigInt(Math.floor(Date.now() / 1000));

  if (now < startTime) {
    const secondsUntilStart = Number(startTime - now);
    const daysUntilStart = Math.ceil(secondsUntilStart / (24 * 60 * 60));
    const hoursUntilStart = Math.ceil(secondsUntilStart / (60 * 60));

    if (daysUntilStart > 1) {
      return `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`;
    } else if (hoursUntilStart > 1) {
      return `Starts in ${hoursUntilStart} hour${hoursUntilStart !== 1 ? 's' : ''}`;
    } else {
      const minutesUntilStart = Math.ceil(secondsUntilStart / 60);
      return `Starts in ${minutesUntilStart} minute${minutesUntilStart !== 1 ? 's' : ''}`;
    }
  }

  if (now > endTime) {
    return 'Completed';
  }

  const secondsLeft = Number(endTime - now);
  const daysLeft = Math.ceil(secondsLeft / (24 * 60 * 60));
  const hoursLeft = Math.ceil(secondsLeft / (60 * 60));

  if (daysLeft > 1) {
    return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
  } else if (hoursLeft > 1) {
    return `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left`;
  } else {
    const minutesLeft = Math.ceil(secondsLeft / 60);
    return `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''} left`;
  }
}

// Helper function to calculate token discount
// 10,000 tokens = $1 discount
function calculateTokenDiscount(tokenBalance: bigint, usdcAmount: bigint): {
  tokensToBurn: bigint;
  discountAmount: bigint;
  finalAmount: bigint;
} {
  if (tokenBalance === BigInt(0) || usdcAmount === BigInt(0)) {
    return {
      tokensToBurn: BigInt(0),
      discountAmount: BigInt(0),
      finalAmount: usdcAmount,
    };
  }

  // Convert token balance to discount in USDC (6 decimals)
  // 10,000 tokens (18 decimals) = 1 USDC (6 decimals)
  // 10,000 tokens = 10,000 * 10^18 = 10^22
  // 1 USDC = 1 * 10^6 = 10^6
  // So: tokenBalance / 10^16 = discount in USDC (6 decimals)
  const maxDiscountFromTokens = tokenBalance / BigInt(10 ** 16);

  // The discount cannot exceed the USDC amount
  const actualDiscount = maxDiscountFromTokens > usdcAmount ? usdcAmount : maxDiscountFromTokens;

  // Calculate how many tokens to burn based on actual discount
  // If actualDiscount = discount in USDC (6 decimals), then tokens = actualDiscount * 10^16
  const tokensToBurn = actualDiscount * BigInt(10 ** 16);

  // Final amount = original - discount
  const finalAmount = usdcAmount - actualDiscount;

  return {
    tokensToBurn,
    discountAmount: actualDiscount,
    finalAmount,
  };
}

const ChallengeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const { address } = useAccount();
  const [challenge, setChallenge] = useState<ContractChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [joinAmount, setJoinAmount] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<bigint>(BigInt(0));
  const [usdcAllowance, setUsdcAllowance] = useState<bigint>(BigInt(0));
  const [tokenAllowance, setTokenAllowance] = useState<bigint>(BigInt(0));
  const [approvalStep, setApprovalStep] = useState<'none' | 'usdc' | 'token' | 'join'>('none');
  const [tokensToBurn, setTokensToBurn] = useState<bigint>(BigInt(0));
  const { composeCast } = useComposeCast();

  // Read challenge data from contract
  const { data: challengeData, refetch: refetchChallenge, isLoading: challengeLoading } = useReadContract({
    address: CONTRACTS.MOTIFY,
    abi: ABIS.MOTIFY,
    functionName: 'getChallengeById',
    args: id ? [BigInt(id)] : undefined,
  } as any);

  // Read participant info from contract
  const { data: participantInfo, refetch: refetchParticipantInfo } = useReadContract({
    address: CONTRACTS.MOTIFY,
    abi: ABIS.MOTIFY,
    functionName: 'getParticipantInfo',
    args: id && address ? [BigInt(id), address] : undefined,
  } as any);

  // Read USDC allowance
  const { data: usdcAllowanceData, refetch: refetchUsdcAllowance } = useReadContract({
    address: CONTRACTS.MOCK_USDC,
    abi: ABIS.MOCK_USDC,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.MOTIFY] : undefined,
  } as any);

  // Read Motify token balance
  const { data: tokenBalanceData, refetch: refetchTokenBalance } = useReadContract({
    address: CONTRACTS.MOTIFY_TOKEN,
    abi: ABIS.MOTIFY_TOKEN,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  } as any);

  // Read Motify token allowance
  const { data: tokenAllowanceData, refetch: refetchTokenAllowance } = useReadContract({
    address: CONTRACTS.MOTIFY_TOKEN,
    abi: ABIS.MOTIFY_TOKEN,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.MOTIFY] : undefined,
  } as any);

  // Wagmi hooks for joining challenge with USDC
  const {
    writeContract: joinContract,
    data: joinHash,
    isPending: joinIsPending,
    error: joinError
  } = useWriteContract();

  const {
    isLoading: joinIsConfirming,
    isSuccess: joinIsConfirmed,
    isError: joinReceiptError
  } = useWaitForTransactionReceipt({
    hash: joinHash,
  });

  // Wagmi hooks for USDC approval
  const {
    writeContract: approveUsdcContract,
    data: approveUsdcHash,
    isPending: approveUsdcIsPending,
    error: approveUsdcError
  } = useWriteContract();

  const {
    isLoading: approveUsdcIsConfirming,
    isSuccess: approveUsdcIsConfirmed,
    isError: approveUsdcReceiptError
  } = useWaitForTransactionReceipt({
    hash: approveUsdcHash,
  });

  // Wagmi hooks for token approval
  const {
    writeContract: approveTokenContract,
    data: approveTokenHash,
    isPending: approveTokenIsPending,
    error: approveTokenError
  } = useWriteContract();

  const {
    isLoading: approveTokenIsConfirming,
    isSuccess: approveTokenIsConfirmed,
    isError: approveTokenReceiptError
  } = useWaitForTransactionReceipt({
    hash: approveTokenHash,
  });

  // Wagmi hooks for claiming refund
  const {
    writeContract: claimContract,
    data: claimHash,
    isPending: claimIsPending,
    error: claimError
  } = useWriteContract();

  const {
    isLoading: claimIsConfirming,
    isSuccess: claimIsConfirmed
  } = useWaitForTransactionReceipt({
    hash: claimHash,
  });

  useEffect(() => {
    if (challengeData) {
      setChallenge(challengeData as ContractChallenge);
      setLoading(false);
    } else if (!challengeLoading && id) {
      setLoading(false);
    }
  }, [challengeData, challengeLoading, id]);

  useEffect(() => {
    if (usdcAllowanceData) {
      setUsdcAllowance(usdcAllowanceData as bigint);
    }
  }, [usdcAllowanceData]);

  useEffect(() => {
    if (tokenBalanceData) {
      setTokenBalance(tokenBalanceData as bigint);
    }
  }, [tokenBalanceData]);

  useEffect(() => {
    if (tokenAllowanceData) {
      setTokenAllowance(tokenAllowanceData as bigint);
    }
  }, [tokenAllowanceData]);

  // Calculate tokens to burn whenever join amount or token balance changes
  useEffect(() => {
    if (joinAmount && !isNaN(parseFloat(joinAmount)) && parseFloat(joinAmount) > 0) {
      const usdcAmount = parseUnits(joinAmount, 6);
      const { tokensToBurn: calculatedTokens } = calculateTokenDiscount(tokenBalance, usdcAmount);
      setTokensToBurn(calculatedTokens);
    } else {
      setTokensToBurn(BigInt(0));
    }
  }, [joinAmount, tokenBalance]);

  useEffect(() => {
    if (joinError) {
      console.error("Join transaction error:", joinError);
      toast.error("Transaction failed: " + joinError.message);
      setIsJoining(false);
      setApprovalStep('none');
      setShowJoinDialog(false);
    }
  }, [joinError]);

  useEffect(() => {
    if (joinIsConfirmed && joinHash) {
      toast.success("Successfully joined challenge!");
      refetchChallenge();
      refetchParticipantInfo();
      setIsJoining(false);
      setShowJoinDialog(false);
      setApprovalStep('none');
    }
  }, [joinIsConfirmed, joinHash, refetchChallenge, refetchParticipantInfo]);

  useEffect(() => {
    if (joinReceiptError) {
      console.error("Join receipt error:", joinReceiptError);
      toast.error("Transaction was reverted or failed");
      setIsJoining(false);
      setApprovalStep('none');
      setShowJoinDialog(false);
    }
  }, [joinReceiptError]);

  useEffect(() => {
    if (approveUsdcError) {
      console.error("USDC approval error:", approveUsdcError);
      toast.error("USDC approval failed: " + approveUsdcError.message);
      setIsJoining(false);
      setApprovalStep('none');
      setShowJoinDialog(false);
    }
  }, [approveUsdcError]);

  useEffect(() => {
    if (approveUsdcIsConfirmed && approveUsdcHash) {
      toast.success("USDC approved!");
      refetchUsdcAllowance();
      // If user has tokens to burn, ask for token approval next
      if (tokensToBurn > BigInt(0)) {
        setApprovalStep('token');
        // Approve unlimited token spending
        handleApproveToken();
      } else {
        setApprovalStep('join');
        // Proceed with joining
        setTimeout(() => {
          handleJoinAfterApprovals();
        }, 1000);
      }
    }
  }, [approveUsdcIsConfirmed, approveUsdcHash, tokensToBurn, refetchUsdcAllowance]);

  useEffect(() => {
    if (approveUsdcReceiptError) {
      console.error("USDC approval receipt error:", approveUsdcReceiptError);
      toast.error("USDC approval transaction failed");
      setIsJoining(false);
      setApprovalStep('none');
      setShowJoinDialog(false);
    }
  }, [approveUsdcReceiptError]);

  useEffect(() => {
    if (approveTokenError) {
      console.error("Token approval error:", approveTokenError);
      toast.error("Token approval failed: " + approveTokenError.message);
      setIsJoining(false);
      setApprovalStep('none');
      setShowJoinDialog(false);
    }
  }, [approveTokenError]);

  useEffect(() => {
    if (approveTokenIsConfirmed && approveTokenHash) {
      toast.success("Token approved!");
      refetchTokenAllowance();
      setApprovalStep('join');
      // Proceed with joining
      setTimeout(() => {
        handleJoinAfterApprovals();
      }, 1000);
    }
  }, [approveTokenIsConfirmed, approveTokenHash, refetchTokenAllowance]);

  useEffect(() => {
    if (approveTokenReceiptError) {
      console.error("Token approval receipt error:", approveTokenReceiptError);
      toast.error("Token approval transaction failed");
      setIsJoining(false);
      setApprovalStep('none');
      setShowJoinDialog(false);
    }
  }, [approveTokenReceiptError]);

  useEffect(() => {
    if (claimError) {
      console.error("Claim transaction error:", claimError);
      toast.error("Claim failed: " + claimError.message);
    }
  }, [claimError]);

  useEffect(() => {
    if (claimIsConfirmed && claimHash) {
      toast.success("Successfully claimed your refund!");
      refetchParticipantInfo();
    }
  }, [claimIsConfirmed, claimHash, refetchParticipantInfo]);

  const handleApproveUsdc = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      toast.info("Requesting USDC approval...");

      approveUsdcContract({
        address: CONTRACTS.MOCK_USDC,
        abi: ABIS.MOCK_USDC,
        functionName: "approve",
        args: [CONTRACTS.MOTIFY, BigInt(2) ** BigInt(256) - BigInt(1)],
      } as any);
    } catch (error: any) {
      console.error("Error approving USDC:", error);
      toast.error(error.message || "Failed to approve USDC");
    }
  };

  const handleApproveToken = async () => {
    if (!address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      toast.info("Requesting Token approval...");

      approveTokenContract({
        address: CONTRACTS.MOTIFY_TOKEN,
        abi: ABIS.MOTIFY_TOKEN,
        functionName: "approve",
        args: [CONTRACTS.MOTIFY, BigInt(2) ** BigInt(256) - BigInt(1)],
      } as any);
    } catch (error: any) {
      console.error("Error approving token:", error);
      toast.error(error.message || "Failed to approve token");
    }
  };

  const handleJoinAfterApprovals = async () => {
    if (!challenge || !id) {
      return;
    }

    const usdcAmount = parseUnits(joinAmount, 6);

    try {
      toast.info("Joining challenge...");

      joinContract({
        address: CONTRACTS.MOTIFY,
        abi: ABIS.MOTIFY,
        functionName: "joinChallenge",
        args: [BigInt(id), usdcAmount],
      } as any);

    } catch (error: any) {
      console.error("Error joining challenge:", error);
      toast.error(error.message || "Failed to join challenge");
      setIsJoining(false);
      setApprovalStep('none');
    }
  };

  const handleJoinChallenge = async () => {
    if (!challenge || !wallet?.isConnected || !id || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    const amount = parseFloat(joinAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error("Minimum stake amount is 1 USDC");
      return;
    }

    const usdcAmount = parseUnits(joinAmount, 6);

    // Calculate discount and final amount
    const { finalAmount, discountAmount } = calculateTokenDiscount(tokenBalance, usdcAmount);

    // Check USDC allowance for the final amount (after discount)
    if (usdcAllowance < finalAmount) {
      setApprovalStep('usdc');
      setIsJoining(true);
      await handleApproveUsdc();
      return;
    }

    // Check if user has tokens to burn and needs token allowance
    if (tokensToBurn > BigInt(0) && tokenAllowance < tokensToBurn) {
      setApprovalStep('token');
      setIsJoining(true);
      // Approve unlimited token spending
      await handleApproveToken();
      return;
    }

    // Proceed with joining
    setApprovalStep('join');
    setIsJoining(true);
    await handleJoinAfterApprovals();
  };

  const handleClaimRefund = async () => {
    if (!wallet?.isConnected || !id) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      toast.info("Please confirm the claim transaction in your wallet...");

      claimContract({
        address: CONTRACTS.MOTIFY,
        abi: ABIS.MOTIFY,
        functionName: "claimRefund",
        args: [BigInt(id)],
      } as any);

    } catch (error: any) {
      console.error("Error claiming refund:", error);
      toast.error(error.message || "Failed to claim refund");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleShare = async () => {
    if (!challenge) return;

    const shareText = `Join my ${challenge.name} challenge! 🎯\n\nGoal: ${challenge.goalAmount.toString()} ${challenge.goalType}\nParticipants: ${challenge.participants.length}\nTotal Pool: ${formatUnits(totalStake, 6)} USDC`;

    composeCast({
      text: shareText,
      embeds: [window.location.href]
    });
  };

  const getStatusBadge = () => {
    if (!challenge) return null;

    if (isChallengeUpcoming(challenge.startTime)) {
      return (
        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border border-orange-500/20 font-medium">
          Upcoming
        </Badge>
      );
    }
    if (isChallengeCompleted(challenge.endTime)) {
      // Check if user was successful based on participant info
      if (participantInfo && Array.isArray(participantInfo) && participantInfo.length >= 4 && participantInfo[3] > 0) { // refundPercentage > 0 means success
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border border-green-500/20 font-medium">
            Completed - Success
          </Badge>
        );
      } else if (participantInfo && Array.isArray(participantInfo) && participantInfo.length >= 3 && participantInfo[2] > 0) { // has stake but no refund
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 border border-red-500/20 font-medium">
            Completed - Failed
          </Badge>
        );
      } else {
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 border border-gray-500/20 font-medium">
            Ended
          </Badge>
        );
      }
    }
    if (isChallengeActive(challenge.startTime, challenge.endTime)) {
      return (
        <Badge variant="secondary" className="bg-green-500/10 text-green-600 border border-green-500/20 font-medium">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
            Active
          </div>
        </Badge>
      );
    }
    return null;
  };

  if (loading || challengeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center bg-gradient-to-br from-card to-card/50 border-border/50">
          <p className="text-muted-foreground mb-4">Challenge not found</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Calculate derived values from contract data
  const isParticipating = address && challenge.participants.some(p =>
    p.participantAddress.toLowerCase() === address.toLowerCase()
  );

  const userStake = address
    ? challenge.participants.find(p =>
      p.participantAddress.toLowerCase() === address.toLowerCase()
    )?.amount || BigInt(0)
    : BigInt(0);

  const totalStake = challenge.participants.reduce((sum, p) => sum + p.amount, BigInt(0));

  // Determine service info from apiType
  const serviceInfo = {
    name: challenge.apiType.toUpperCase(),
    logo: challenge.apiType.toLowerCase() === 'strava' ? '/strava_logo.svg' :
      challenge.apiType.toLowerCase() === 'github' ? '/github-white.svg' : null,
    color: challenge.apiType.toLowerCase() === 'strava' ? 'bg-orange-500' :
      challenge.apiType.toLowerCase() === 'github' ? 'bg-black' : 'bg-primary'
  };

  const isGithub = serviceInfo.name === 'GITHUB';
  const activityInfo = getActivityTypeInfo(challenge.goalType as any); // Cast since we don't have strict typing

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Challenge Details</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              title="Share this challenge"
            >
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-4 pb-24">

        {/* Participation Status */}
        {isParticipating && (
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-600 mb-1">You're In!</p>
                <p className="text-xs text-muted-foreground">Staked: <span className="font-mono font-semibold">{formatUnits(userStake, 6)} USDC</span></p>
              </div>
            </div>

            {participantInfo && Array.isArray(participantInfo) && participantInfo.length >= 5 && (
              <div className="mt-3 pt-3 border-t border-green-500/20 text-xs text-muted-foreground space-y-1">
                <p className="font-mono">Initial: {formatUnits(participantInfo[1], 6)} USDC</p>
                <p className="font-mono">Current: {formatUnits(participantInfo[2], 6)} USDC</p>
                <p>Refund %: <span className="font-semibold">{participantInfo[3].toString()}%</span></p>
                <p>Status: <span className="font-semibold">{
                  participantInfo[4] ? "Result Declared" : "Pending"
                }</span></p>
              </div>
            )}
          </Card>
        )}

        {/* Hero Card with Service Info */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}></div>
          </div>

          <div className="relative">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-16 h-16 rounded-full ${serviceInfo.color} flex items-center justify-center shadow-lg overflow-hidden shrink-0 ${isGithub ? 'border-2 border-black' : ''}`}>
                {serviceInfo.logo ? (
                  <img
                    src={serviceInfo.logo}
                    alt={serviceInfo.name}
                    className="block w-full h-full object-contain"
                  />
                ) : (
                  <TrendingUp className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wider">{serviceInfo.name}</span>
                  {getStatusBadge()}
                  {challenge.recipient !== "0x0000000000000000000000000000000000000000" && (
                    <Badge variant="secondary" className="bg-red-500/10 text-red-600 border border-red-500/20">
                      <Heart className="w-3 h-3 mr-1 fill-red-500/20" />
                      Charity
                    </Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2 break-words">{challenge.name}</h2>
                <p className="text-xs text-muted-foreground">ID: #{challenge.challengeId.toString()}</p>
              </div>
            </div>

            {/* Challenge Description */}
            <div className="mb-4">
              <p className="text-muted-foreground text-sm leading-relaxed break-words">{challenge.description}</p>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
              <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg">
                <div className="bg-primary/10 text-primary w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Total Pool</p>
                  <p className="font-semibold text-base truncate">{formatUnits(totalStake, 6)} USDC</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg">
                <div className="bg-green-500/10 text-green-600 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Participants</p>
                  <p className="font-semibold text-base">{challenge.participants.length}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Goal Card */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Challenge Goal</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-background rounded-lg">
              <div className="flex items-end justify-between gap-3 mb-2">
                {activityInfo && (
                  <span className="text-xl font-medium text-muted-foreground leading-none pb-0.5">
                    {activityInfo.unit}
                  </span>
                )}
                <span className="text-2xl font-bold text-primary leading-none">{challenge.goalAmount.toString()}</span>
              </div>
            </div>

            {/* Thin divider */}
            <div className="h-px bg-border/50" />

            {activityInfo && (
              <div className="flex items-start gap-2 text-sm">
                <span className="font-medium text-foreground">Activity type:</span>
                <span className="text-muted-foreground">{activityInfo.label}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Timeline Card */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-orange-500" />
            <h3 className="font-semibold text-lg">Timeline</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-muted-foreground">Start Date</span>
              <span className="font-medium text-sm text-right break-words">{formatTimestamp(challenge.startTime)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-muted-foreground">End Date</span>
              <span className="font-medium text-sm text-right break-words">{formatTimestamp(challenge.endTime)}</span>
            </div>
            <div className="flex justify-between items-center gap-4 pt-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="font-semibold text-sm text-orange-500">{formatDuration(challenge.startTime, challenge.endTime)}</span>
            </div>
          </div>
        </Card>

        {/* Contract & Wallet Addresses Card */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-lg">Contract Information</h3>
          </div>
          <div className="space-y-3">
            {/* Smart Contract Address */}
            <div className="p-3 bg-background/50 rounded-lg">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground">Smart Contract</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => copyToClipboard(CONTRACTS.MOTIFY, "Contract Address")}
                >
                  {copiedAddress === "Contract Address" ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <p className="font-mono text-xs break-all text-foreground/80">{CONTRACTS.MOTIFY}</p>
              <a
                href={`https://sepolia.basescan.org/address/${CONTRACTS.MOTIFY}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mt-2"
              >
                View on Basescan
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Charity Wallet (if applicable) */}
            {challenge.recipient !== "0x0000000000000000000000000000000000000000" && (
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-500 fill-red-500/20" />
                  <span className="text-xs font-medium text-red-600">Charity Wallet</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 ml-auto"
                    onClick={() => copyToClipboard(challenge.recipient, "Charity Wallet")}
                  >
                    {copiedAddress === "Charity Wallet" ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="font-mono text-xs break-all text-foreground/80 mb-2">{challenge.recipient}</p>
                <p className="text-xs text-muted-foreground">
                  Failed stakes will be donated to this address
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Most Wagered Leaderboard */}
        <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-lg">Most Wagered</h3>
            </div>
            <Badge variant="secondary" className="bg-muted text-foreground">
              Top 5
            </Badge>
          </div>
          <div className="space-y-2">
            {challenge.participants.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No participants yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to join!</p>
              </div>
            ) : (
              [...challenge.participants]
                .sort((a, b) => Number(b.amount) - Number(a.amount))
                .slice(0, 5)
                .map((participant, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-medium truncate">
                          {participant.participantAddress.substring(0, 6)}...
                          {participant.participantAddress.substring(participant.participantAddress.length - 4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold whitespace-nowrap text-primary">{formatUnits(participant.amount, 6)} USDC</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>

        {/* Join Dialog */}
        {!isParticipating && wallet?.isConnected && !isChallengeCompleted(challenge.endTime) && (
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
                size="lg"
                disabled={isJoining}
              >
                {approveUsdcIsPending || approveUsdcIsConfirming
                  ? "Approving USDC..."
                  : approveTokenIsPending || approveTokenIsConfirming
                    ? "Approving Token..."
                    : joinIsPending
                      ? "Confirm in Wallet..."
                      : joinIsConfirming
                        ? "Joining..."
                        : "Join Challenge"}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gradient-to-br from-card to-card/50">
              <DialogHeader>
                <DialogTitle>Join Challenge</DialogTitle>
                <DialogDescription>
                  Enter the amount you want to stake for this challenge (in USDC). Minimum 1 USDC.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Token Balance Info */}
                {tokenBalance > BigInt(0) && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs font-medium text-blue-600 mb-1">💎 Motify Token Balance</p>
                    <p className="font-mono text-sm font-semibold text-blue-600">{formatUnits(tokenBalance, 18)} tokens</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your tokens will reduce your payment (10,000 tokens = $1)
                    </p>
                  </div>
                )}

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label htmlFor="amount">Desired Stake Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="10"
                    min="1"
                    step="1"
                    value={joinAmount}
                    onChange={(e) => setJoinAmount(e.target.value)}
                    className="bg-background"
                    disabled={isJoining}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the total stake amount you want to commit to this challenge
                  </p>
                </div>

                {/* Price Breakdown - Always show when amount is entered */}
                {joinAmount && !isNaN(parseFloat(joinAmount)) && parseFloat(joinAmount) > 0 && (
                  <div className="p-4 bg-gradient-to-br from-card to-card/50 border-2 border-primary/20 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-primary" />
                      </div>
                      <p className="font-semibold text-base">Payment Summary</p>
                    </div>

                    {/* Stake Amount */}
                    <div className="space-y-1 pb-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Challenge Stake</span>
                        <span className="font-mono text-lg font-bold">{joinAmount} USDC</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Amount locked in the smart contract
                      </p>
                    </div>

                    <div className="h-px bg-border"></div>

                    {/* Token Discount Section */}
                    {tokensToBurn > BigInt(0) ? (
                      <>
                        <div className="space-y-2 bg-green-500/5 p-3 rounded-lg border border-green-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-green-600">🎉 DISCOUNT APPLIED</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Tokens Used</span>
                            <span className="font-mono text-sm font-semibold">
                              🔥 {parseFloat(formatUnits(tokensToBurn, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Discount Value</span>
                            <span className="font-mono text-sm font-semibold text-green-600">
                              -{formatUnits(calculateTokenDiscount(tokenBalance, parseUnits(joinAmount, 6)).discountAmount, 6)} USDC
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-green-500/20">
                            💡 These tokens will be permanently burned to reduce your payment
                          </p>
                        </div>

                        <div className="h-px bg-border"></div>

                        {/* Final Payment */}
                        <div className="space-y-1 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold">You Will Pay</span>
                            <span className="font-mono text-2xl font-bold text-primary">
                              {formatUnits(calculateTokenDiscount(tokenBalance, parseUnits(joinAmount, 6)).finalAmount, 6)} USDC
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground text-right">
                            (Original: {joinAmount} USDC - Discount: {formatUnits(calculateTokenDiscount(tokenBalance, parseUnits(joinAmount, 6)).discountAmount, 6)} USDC)
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* No Discount */}
                        {tokenBalance > BigInt(0) ? (
                          <div className="space-y-2 bg-blue-500/5 p-3 rounded-lg border border-blue-500/20">
                            <p className="text-xs text-blue-600">
                              �                                                             💡 Available tokens: {parseFloat(formatUnits(tokenBalance, 18)).toLocaleString(undefined, { maximumFractionDigits: 2 })} tokens
                            </p>
                            <p className="text-xs text-muted-foreground">
                              All your tokens will be used for discount (10,000 tokens = $1)
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                            <p className="text-xs text-muted-foreground">
                              💡 No Motify tokens available for discount
                            </p>
                          </div>
                        )}

                        <div className="h-px bg-border"></div>

                        {/* Final Payment - No Discount */}
                        <div className="space-y-1 pt-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold">You Will Pay</span>
                            <span className="font-mono text-2xl font-bold text-primary">{joinAmount} USDC</span>
                          </div>
                          <p className="text-xs text-muted-foreground text-right">
                            Full price - no discount applied
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Approval Status */}
                {(approveUsdcIsPending || approveUsdcIsConfirming || approveTokenIsPending || approveTokenIsConfirming) && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    {approveUsdcIsPending || approveUsdcIsConfirming ? (
                      <>
                        <p className="text-xs font-medium text-amber-600">Approving USDC...</p>
                        <p className="text-xs text-muted-foreground mt-1">Step 1 of {tokensToBurn > BigInt(0) ? '3' : '2'}</p>
                      </>
                    ) : approveTokenIsPending || approveTokenIsConfirming ? (
                      <>
                        <p className="text-xs font-medium text-amber-600">Approving Tokens...</p>
                        <p className="text-xs text-muted-foreground mt-1">Step 2 of 3</p>
                      </>
                    ) : null}
                  </div>
                )}

                {/* Join Button */}
                <Button
                  onClick={handleJoinChallenge}
                  disabled={isJoining}
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                  size="lg"
                >
                  {approveUsdcIsPending || approveUsdcIsConfirming
                    ? "Approve USDC in Wallet..."
                    : approveTokenIsPending || approveTokenIsConfirming
                      ? "Approve Token in Wallet..."
                      : joinIsPending
                        ? "Confirm in Wallet..."
                        : joinIsConfirming
                          ? "Confirming..."
                          : isJoining
                            ? "Processing..."
                            : "Confirm and Join"}
                </Button>

                {/* Transaction Hash */}
                {joinHash && (
                  <p className="text-xs text-center text-muted-foreground font-mono break-all">
                    Tx: {joinHash.slice(0, 10)}...{joinHash.slice(-8)}
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Claim Button */}
        {isParticipating && participantInfo && Array.isArray(participantInfo) && participantInfo.length >= 4 && participantInfo[2] > 0 && (participantInfo[3] > 0 || !isChallengeActive(challenge.startTime, challenge.endTime)) && (
          <>
            <Button
              onClick={handleClaimRefund}
              disabled={claimIsPending || claimIsConfirming}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:opacity-90 shadow-lg"
              size="lg"
            >
              {claimIsPending
                ? "Confirm in Wallet..."
                : claimIsConfirming
                  ? "Claiming..."
                  : participantInfo[3] > 0
                    ? "Claim Your Refund (Winner) 🎉"
                    : "Claim Refund (Timeout)"}
            </Button>
            {claimHash && (
              <p className="text-xs text-center text-muted-foreground font-mono break-all">
                Claim Tx: {claimHash.slice(0, 10)}...{claimHash.slice(-8)}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default ChallengeDetail;