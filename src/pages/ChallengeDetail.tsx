// pages/ChallengeDetail.tsx
import { ArrowLeft, Calendar, DollarSign, Users, Trophy, Target, Loader2, TrendingUp, Heart, Wallet, Copy, CheckCircle2, ExternalLink, Share2, Check } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { apiService, Challenge, ChallengeProgress, isChallengeActive, isChallengeCompleted, isChallengeUpcoming, getActivityTypeInfo, calculateProgressPercentage, getProgressStatus  } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from "wagmi";
import { CONTRACT_ADDRESS, MOTIFY_ABI, toBlockchainChallengeId } from "@/contract";
import { parseEther } from "viem";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ChallengeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const { address } = useAccount();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [joinAmount, setJoinAmount] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [challengeIdOnChain, setChallengeIdOnChain] = useState<number | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Wagmi hooks for joining challenge
  const {
    writeContract: joinContract,
    data: joinHash,
    isPending: joinIsPending,
    error: joinError
  } = useWriteContract();

  const {
    isLoading: joinIsConfirming,
    isSuccess: joinIsConfirmed
  } = useWaitForTransactionReceipt({
    hash: joinHash,
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

  // Read participant info from contract
  const { data: participantInfo, refetch: refetchParticipantInfo } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MOTIFY_ABI,
    functionName: 'getParticipantInfo',
    args: challengeIdOnChain !== null && address ? [BigInt(challengeIdOnChain), address] : undefined,
  } as any);

  useEffect(() => {
    loadChallenge();
  }, [id, wallet?.address]);

  useEffect(() => {
    if (joinError) {
      console.error("Join transaction error:", joinError);
      toast.error("Transaction failed: " + joinError.message);
      setIsJoining(false);
    }
  }, [joinError]);

  useEffect(() => {
    if (joinIsConfirmed && joinHash) {
      toast.success("Successfully joined challenge on blockchain!");
      saveJoinToBackend();
    }
  }, [joinIsConfirmed, joinHash]);

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
  }, [claimIsConfirmed, claimHash]);

  const loadChallenge = async () => {
    if (!id) return;

    try {
      setLoading(true);
      // Pass wallet address to get user-specific challenge data (isUserParticipating, etc.)
      const challengeData = await apiService.getChallenge(parseInt(id), wallet?.address);

      if (!challengeData) {
        toast.error("Challenge not found");
        navigate("/");
        return;
      }

      setChallenge(challengeData);

      if (challengeData.id !== undefined) {
        const blockchainId = toBlockchainChallengeId(challengeData.id);
        setChallengeIdOnChain(blockchainId);
        console.log(`Frontend Challenge ID: ${challengeData.id} -> Blockchain Challenge ID: ${blockchainId}`);
      }

      if (wallet?.address && challengeData.isUserParticipating) {
        const progressData = await apiService.getChallengeProgress(
          challengeData.id,
          wallet.address,
          1000
        );
        setProgress(progressData);
      }
    } catch (error) {
      console.error("Error loading challenge:", error);
      toast.error("Failed to load challenge");
    } finally {
      setLoading(false);
    }
  };

  const saveJoinToBackend = async () => {
    if (!challenge || !wallet?.address) return;

    const amount = parseFloat(joinAmount);
    if (isNaN(amount) || amount < 0.00001) {
      toast.error("Minimum stake amount is 0.00001 USDC");
      return;
    }

    setIsJoining(true);

    try {
      toast.info("Please confirm the transaction in your wallet...");

      joinContract({
        address: CONTRACT_ADDRESS,
        abi: MOTIFY_ABI,
        functionName: "joinChallenge",
        args: [BigInt(challengeIdOnChain)],
        value: parseEther(joinAmount),
      } as any);

    } catch (error: any) {
      console.error("Error joining challenge:", error);
      toast.error(error.message || "Failed to join challenge");
      setIsJoining(false);
    }
  };

  const handleClaimRefund = async () => {
    if (!wallet?.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (challengeIdOnChain === null) {
      toast.error("Challenge ID not available. Please try again.");
      return;
    }

    try {
      toast.info("Please confirm the claim transaction in your wallet...");

      claimContract({
        address: CONTRACT_ADDRESS,
        abi: MOTIFY_ABI,
        functionName: "claim",
        args: [BigInt(challengeIdOnChain)],
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
    const shareText = `Join my challenge: ${challenge?.title}! 🚀\n\n${challenge?.description}\n\nStake: ${challenge?.stake.toFixed(3)} USDC\nParticipants: ${challenge?.participants}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: challenge?.title,
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Challenge details copied to clipboard!");
      } catch (err) {
        toast.error("Failed to share");
      }
    }
  };

  const getStatusBadge = () => {
    if (!challenge) return null;
    const { originalStartDate, originalEndDate, isCompleted } = challenge; // Use original dates and isCompleted flag

    if (isChallengeUpcoming(originalStartDate)) {
      return (
        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border border-orange-500/20 font-medium">
          Upcoming
        </Badge>
      );
    }
    if (isChallengeCompleted(originalEndDate)) { // Check against originalEndDate
      if (progress && progress.currentlySucceeded) {
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border border-green-500/20 font-medium">
            Completed - Success
          </Badge>
        );
      } else if (progress) {
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
    if (isChallengeActive(originalStartDate, originalEndDate)) { // Check against original dates
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

  const handleJoinChallenge = async () => {
    if (!challenge || !wallet?.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (challengeIdOnChain === null) {
      toast.error("Challenge ID not available. Please try again.");
      return;
    }

    const amount = parseFloat(joinAmount);
    if (isNaN(amount) || amount < 0.00001) {
      toast.error("Minimum stake amount is 0.00001 USDC");
      return;
    }

    setIsJoining(true);

    try {
      toast.info("Please confirm the transaction in your wallet...");

      joinContract({
        address: CONTRACT_ADDRESS,
        abi: MOTIFY_ABI,
        functionName: "joinChallenge",
        args: [BigInt(challengeIdOnChain)],
        value: parseEther(joinAmount),
      } as any);

    } catch (error: any) {
      console.error("Error joining challenge:", error);
      toast.error(error.message || "Failed to join challenge");
      setIsJoining(false);
    }
  };

  if (loading) {
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

  const isParticipating = challenge.isUserParticipating; // Simplified
  const userStake = challenge.userStakeAmount; // Simplified


  const progressPercentage = calculateProgressPercentage(progress);

  const progressStatus = getProgressStatus(progress, challenge ? isChallengeCompleted(challenge.originalEndDate) : false);


  const serviceInfo = {
    name: challenge.serviceType.toUpperCase(),
    logo: challenge.serviceType === 'strava' ? '/strava_logo.svg' : challenge.serviceType === 'github' ? '/github-white.svg' : null,
    color: challenge.serviceType === 'strava' ? 'bg-orange-500' : challenge.serviceType === 'github' ? 'bg-black' : 'bg-primary'
  };
  const isGithub = serviceInfo.name === 'GITHUB';
  const activityInfo = getActivityTypeInfo(challenge.activityType);

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
                <p className="text-xs text-muted-foreground">Staked: <span className="font-mono font-semibold">{userStake.toFixed(4)} USDC</span></p>
              </div>
            </div>

            {participantInfo && (
              <div className="mt-3 pt-3 border-t border-green-500/20 text-xs text-muted-foreground space-y-1">
                <p className="font-mono">On-chain: {(Number(participantInfo[0]) / 1e18).toFixed(6)} USDC</p>
                <p>Status: <span className="font-semibold">{
                  participantInfo[1] === 0 ? "Pending" :
                    participantInfo[1] === 1 ? "Winner 🎉" :
                      "Loser"
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
                  {challenge.isCharity && (
                    <Badge variant="secondary" className="bg-red-500/10 text-red-600 border border-red-500/20">
                      <Heart className="w-3 h-3 mr-1 fill-red-500/20" />
                      Charity
                    </Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold mb-2 break-words">{challenge.title}</h2>
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
                  <p className="font-semibold text-base truncate">{challenge.stake.toFixed(4)} USDC</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-background/50 p-3 rounded-lg">
                <div className="bg-green-500/10 text-green-600 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Participants</p>
                  <p className="font-semibold text-base">{challenge.participants}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Progress Card */}
        {isParticipating && !isChallengeUpcoming(challenge.originalStartDate) && (
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Your Progress</h3>
              </div>
            </div>
            {progress ? (
              <>
                {/* Goal and Activity Summary */}
                <div className="mb-4 p-4 bg-background rounded-lg border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Daily Goal</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-primary">{challenge.goal}</span>
                      {activityInfo && (
                        <span className="text-sm text-muted-foreground">{activityInfo.unit}</span>
                      )}
                    </div>
                  </div>
                  {activityInfo && (
                    <p className="text-xs text-muted-foreground">
                      Complete {challenge.goal} {activityInfo.unit.toLowerCase()} each day to stay on track
                    </p>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Days Completed</span>
                    <span className="font-medium">
                      {progress.progress.filter(d => d.achieved).length} / {progress.progress.length}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">{progressPercentage}% complete</p>
                  {/* Use the status from the new function */}
                  <Badge variant="secondary" className={
                    progressStatus.variant === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
                    progressStatus.variant === 'warning' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' :
                    progressStatus.variant === 'failed' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                    'bg-gray-500/10 text-gray-600 border border-gray-500/20' // For 'ended' or default
                  }>
                    {progressStatus.status}
                  </Badge>
                </div>

                {/* Daily Progress Grid */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Daily Progress</p>
                  <div className="grid grid-cols-7 gap-1.5">
                    {progress.progress.map((day, index) => (
                      <div
                        key={index}
                        className={`aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors ${day.achieved
                          ? 'bg-green-500 text-white'
                          : 'bg-muted text-muted-foreground'
                          }`}
                        title={`Day ${index + 1} (${day.date}): ${day.achieved ? 'Achieved' : 'Not achieved'}${day.value ? ` - ${day.value} ${activityInfo?.unit || ''}` : ''}`}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Hover over each day to see detailed progress
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading progress...</p>
              </div>
            )}
          </Card>
        )}

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
                <span className="text-2xl font-bold text-primary leading-none">{challenge.goal}</span>
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
              <span className="font-medium text-sm text-right break-words">{challenge.startDate}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-muted-foreground">End Date</span>
              <span className="font-medium text-sm text-right break-words">{challenge.endDate}</span>
            </div>
            <div className="flex justify-between items-center gap-4 pt-2 border-t border-border/50">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="font-semibold text-sm text-orange-500">{challenge.duration}</span>
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
                  onClick={() => copyToClipboard(challenge.contract_address, "Contract Address")}
                >
                  {copiedAddress === "Contract Address" ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <p className="font-mono text-xs break-all text-foreground/80">{challenge.contract_address}</p>
              <a
                href={`https://sepolia.etherscan.io/address/${challenge.contract_address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mt-2"
              >
                View on Etherscan
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Charity Wallet (if applicable) */}
            {challenge.isCharity && challenge.charityWallet && (
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-500 fill-red-500/20" />
                  <span className="text-xs font-medium text-red-600">Charity Wallet</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 ml-auto"
                    onClick={() => copyToClipboard(challenge.charityWallet!, "Charity Wallet")}
                  >
                    {copiedAddress === "Charity Wallet" ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="font-mono text-xs break-all text-foreground/80 mb-2">{challenge.charityWallet}</p>
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
            {challenge.participantsList.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No participants yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to join!</p>
              </div>
            ) : (
              [...challenge.participantsList]
                .sort((a, b) => b.amountUsd - a.amountUsd)
                .slice(0, 5)
                .map((participant, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm font-medium truncate">
                          {participant.walletAddress.substring(0, 6)}...
                          {participant.walletAddress.substring(participant.walletAddress.length - 4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold whitespace-nowrap text-primary">{participant.amountUsd.toFixed(4)} USDC</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>

        {/* Join Dialog */}
        {!isParticipating && wallet?.isConnected && (
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
                size="lg"
                disabled={joinIsPending || joinIsConfirming}
              >
                {joinIsPending
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
                  Enter the amount you want to stake for this challenge. Minimum 0.00001 USDC.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Stake Amount (USDC)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.01"
                    min="0.00001"
                    step="0.00001"
                    value={joinAmount}
                    onChange={(e) => setJoinAmount(e.target.value)}
                    className="bg-background"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your stake will be locked in the smart contract until the challenge ends.
                  </p>
                </div>
                <Button
                  onClick={handleJoinChallenge}
                  disabled={isJoining || joinIsPending || joinIsConfirming}
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                  size="lg"
                >
                  {joinIsPending
                    ? "Confirm in Wallet..."
                    : joinIsConfirming
                      ? "Confirming..."
                      : isJoining
                        ? "Saving..."
                        : "Confirm and Join"}
                </Button>
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
        {isParticipating && participantInfo && participantInfo[0] > 0 && (participantInfo[1] === 1 || !challenge.active) && (
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
                  : participantInfo[1] === 1
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