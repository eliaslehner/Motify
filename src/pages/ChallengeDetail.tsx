import { ArrowLeft, Calendar, DollarSign, Users, Trophy, Target, Loader2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { apiService, Challenge, ChallengeProgress, isChallengeActive, isChallengeCompleted, isChallengeUpcoming } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
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
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [progress, setProgress] = useState<ChallengeProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [joinAmount, setJoinAmount] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  useEffect(() => {
    loadChallenge();
  }, [id, wallet?.address]);

  const loadChallenge = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const challengeData = await apiService.getChallenge(parseInt(id));
      
      if (!challengeData) {
        toast.error("Challenge not found");
        navigate("/");
        return;
      }

      setChallenge(challengeData);

      // Load progress if user is participating
      if (wallet?.address && apiService.isUserParticipating(challengeData, wallet.address)) {
        const progressData = await apiService.getChallengeProgress(
          challengeData.id,
          wallet.address
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

  const handleJoinChallenge = async () => {
    if (!challenge || !wallet?.isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    const amount = parseFloat(joinAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error("Minimum stake amount is $1 USD");
      return;
    }

    setIsJoining(true);

    try {
      await apiService.joinChallenge(challenge.id, wallet.address, amount);
      toast.success("Successfully joined the challenge!");
      setShowJoinDialog(false);
      loadChallenge(); // Reload to update participant list
    } catch (error: any) {
      console.error("Error joining challenge:", error);
      toast.error(error.message || "Failed to join challenge");
    } finally {
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
        <Card className="p-8 text-center bg-gradient-card border-border">
          <p className="text-muted-foreground mb-4">Challenge not found</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isParticipating = wallet?.address 
    ? apiService.isUserParticipating(challenge, wallet.address)
    : false;
  const userStake = wallet?.address 
    ? apiService.getUserStakeAmount(challenge, wallet.address)
    : 0;

  // Calculate progress percentage from progress data
  let progressPercentage = 0;
  if (progress?.progress && progress.progress.length > 0) {
    const achievedDays = progress.progress.filter(day => day.achieved).length;
    progressPercentage = Math.round((achievedDays / progress.progress.length) * 100);
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Challenge Details</h1>
        </div>
      </header>

      {/* Status Badge */}
      <div className="container mx-auto px-4 pt-4">
        {(() => {
          // Use the original datetime strings from the backend for accurate comparison
          const backendStartDate = challenge.startDate; // This will be the formatted display date
          const backendEndDate = challenge.endDate; // This will be the formatted display date
          
          // We need to get the original challenge data to check precise timing
          // For now, we'll use the challenge.active property which is set accurately in mapBackendToFrontend
          if (isChallengeUpcoming(challenge.startDate) || (!challenge.active && challenge.duration.includes('Starts in'))) {
            return (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-500">
                Upcoming
              </Badge>
            );
          } else if (!challenge.active && challenge.duration === 'Completed') {
            // Check if user succeeded (if participating)
            if (progress && progress.currentlySucceeded) {
              return (
                <Badge variant="secondary" className="bg-success-light text-success">
                  Completed - Success
                </Badge>
              );
            } else if (progress) {
              return (
                <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                  Completed - Failed
                </Badge>
              );
            } else {
              return (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  Completed
                </Badge>
              );
            }
          } else {
            return (
              <Badge variant="secondary" className="bg-success-light text-success">
                Active
              </Badge>
            );
          }
        })()}
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Title Card */}
        <Card className="p-6 bg-gradient-card border-border">
          <h2 className="text-2xl font-bold mb-4">{challenge.title}</h2>
          <p className="text-muted-foreground mb-6">{challenge.description}</p>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary w-10 h-10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stake</p>
                <p className="font-semibold text-lg">{challenge.stake} USDC</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-accent/10 text-accent w-10 h-10 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Participants</p>
                <p className="font-semibold text-lg">{challenge.participants}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Progress Card - Only show if participating */}
        {isParticipating && (
          <Card className="p-6 bg-gradient-card border-border">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Your Progress</h3>
            </div>
            {progress ? (
              <>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Days Completed</span>
                    <span className="font-medium">
                      {progress.progress.filter(d => d.achieved).length} / {progress.progress.length}
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{progressPercentage}% complete</p>
                  {progress.currentlySucceeded ? (
                    <Badge variant="secondary" className="bg-success-light text-success">
                      On Track
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-warning/20 text-warning">
                      Behind
                    </Badge>
                  )}
                </div>
                
                {/* Daily Progress Breakdown */}
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Daily Progress</p>
                  <div className="grid grid-cols-7 gap-1">
                    {progress.progress.map((day, index) => (
                      <div
                        key={index}
                        className={`h-8 rounded flex items-center justify-center text-xs ${
                          day.achieved 
                            ? 'bg-success text-white' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                        title={`${day.date}: ${day.achieved ? 'Achieved' : 'Not achieved'}${day.value ? ` (${day.value})` : ''}`}
                      >
                        {index + 1}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading progress...</p>
              </div>
            )}
          </Card>
        )}

        {/* Timeline Card */}
        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-warning" />
            <h3 className="font-semibold text-lg">Timeline</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">{challenge.startDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-medium">{challenge.endDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time Remaining</span>
              <span className="font-medium text-warning">{challenge.duration}</span>
            </div>
          </div>
        </Card>

        {/* API Integration Card */}
        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">API</h3>
              <p className="text-muted-foreground text-sm">STRAVA API</p>
            </div>
            <div className="flex items-center justify-center">
              <img 
                src="/strava_logo.svg" 
                alt="Strava API" 
                className="h-12 w-12 rounded-full object-cover"
              />
            </div>
          </div>
        </Card>

        {/* Participants Card */}
        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-success" />
            <h3 className="font-semibold text-lg">Participants</h3>
          </div>
          <div className="space-y-3">
            {challenge.participantsList.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No participants yet. Be the first to join!
              </p>
            ) : (
              challenge.participantsList.map((participant, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {participant.walletAddress.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium font-mono text-sm">
                        {participant.walletAddress.substring(0, 6)}...
                        {participant.walletAddress.substring(participant.walletAddress.length - 4)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${participant.amountUsd}</p>
                    <p className="text-xs text-muted-foreground">staked</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Action Button - Only show if user is not participating */}
        {!isParticipating && wallet?.isConnected && (
          <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                Join Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gradient-card">
              <DialogHeader>
                <DialogTitle>Join Challenge</DialogTitle>
                <DialogDescription>
                  Enter the amount you want to stake for this challenge. Minimum $1 USD.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Stake Amount (USD)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="100"
                    min="1"
                    step="0.01"
                    value={joinAmount}
                    onChange={(e) => setJoinAmount(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <Button
                  onClick={handleJoinChallenge}
                  disabled={isJoining}
                  className="w-full bg-gradient-primary"
                  size="lg"
                >
                  {isJoining ? "Joining..." : "Confirm and Join"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {isParticipating && (
          <Card className="p-4 bg-success/10 border-success">
            <p className="text-center text-success font-medium">
              You're participating with ${userStake} staked
            </p>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ChallengeDetail;
