// pages/Home.tsx
import { useState, useEffect } from "react";
import { Plus, Trophy, Target, Zap, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { WebLogin } from "@/components/WebLogin";
import { WalletStatus } from "@/components/WalletStatus";
import { PageHeader } from "@/components/PageHeader";
import { ChallengeCard, Challenge } from "@/components/ChallengeCard";
import { calculateDuration, isChallengeActive, isChallengeCompleted, isChallengeUpcoming } from "@/utils/challengeHelpers";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, MOTIFY_ABI } from "@/contract";

interface BlockchainChallenge {
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
  participantCount: bigint;
}

interface HomeChallenge {
  id: number;
  title: string;
  description: string;
  serviceType: string;
  goalType: string;
  goalAmount: number;
  startDate: Date;
  endDate: Date;
  participants: number;
  isPrivate: boolean;
  isCompleted: boolean;
  duration: string;
}

const Home = () => {
  const { user, wallet, isLoading: authLoading, isInMiniApp, isAuthenticated } = useAuth();
  const [userChallenges, setUserChallenges] = useState<HomeChallenge[]>([]);

  // Read challenges from blockchain for the user
  const { data: blockchainChallenges, isLoading: loadingChallenges, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MOTIFY_ABI,
    functionName: 'getChallengesForParticipant',
    args: wallet?.address ? [wallet.address as `0x${string}`] : undefined,
    query: {
      enabled: !!wallet?.address,
      refetchInterval: 10000, // Refetch every 10 seconds
      refetchOnWindowFocus: true, // Refetch when user returns to tab
    }
  });

  useEffect(() => {
    if (blockchainChallenges) {
      const formattedChallenges = (blockchainChallenges as BlockchainChallenge[]).map(bc => {
        const startDate = new Date(Number(bc.startTime) * 1000);
        const endDate = new Date(Number(bc.endTime) * 1000);
        const duration = calculateDuration(startDate, endDate);

        return {
          id: Number(bc.challengeId),
          title: bc.name,
          description: bc.description,
          serviceType: bc.apiType.toLowerCase(),
          goalType: bc.goalType,
          goalAmount: Number(bc.goalAmount),
          startDate,
          endDate,
          participants: Number(bc.participantCount),
          isPrivate: bc.isPrivate,
          isCompleted: bc.resultsFinalized,
          duration,
        };
      });
      setUserChallenges(formattedChallenges);
    }
  }, [blockchainChallenges]);

  if (!isInMiniApp && !isAuthenticated && !authLoading) {
    return <WebLogin />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="My Challenges"
      />

      <main className="container mx-auto px-4 py-6">
        {authLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Connecting to your account...</p>
            </div>
          </div>
        ) : !wallet?.isConnected ? (
          <div className="space-y-4">
            <WalletStatus />
            <Card className="p-8 text-center bg-gradient-to-br from-card to-card/50 border-border/50">
              <p className="text-muted-foreground mb-4">
                {isInMiniApp
                  ? 'Connect your wallet to view and manage your challenges.'
                  : 'Connect your wallet to get started with Motify.'}
              </p>
              <p className="text-sm text-muted-foreground">
                Or explore challenges in the Discover tab.
              </p>
            </Card>
          </div>
        ) : loadingChallenges ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your challenges...</p>
            </div>
          </div>
        ) : isError ? (
          <Card className="p-8 text-center bg-gradient-to-br from-card to-card/50 border-border/50">
            <p className="text-muted-foreground mb-4">
              Failed to load challenges from blockchain.
            </p>
            <Button
              variant="outline"
              onClick={() => refetch()}
            >
              Try Again
            </Button>
          </Card>
        ) : userChallenges.length === 0 ? (
          <div className="space-y-6">
            {/* Empty state with more excitement */}
            <Card className="p-8 text-center bg-gradient-to-br from-primary/5 via-card to-card/50 border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                  backgroundSize: '32px 32px'
                }}></div>
              </div>

              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <Trophy className="h-10 w-10 text-white" />
                </div>

                <h4 className="text-xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Get ready!
                </h4>

                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Discover exciting challenges, compete with others, and achieve your goals!
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full sm:w-auto">
                  <Link to="/discover" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:min-w-[200px] bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg">
                      <Zap className="mr-2 h-5 w-5" />
                      Discover Challenges
                    </Button>
                  </Link>
                  <Link to="/create" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:min-w-[200px]">
                      <Plus className="mr-2 h-5 w-5" />
                      Create Your Own
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Set Goals</h4>
                    <p className="text-xs text-muted-foreground">Track activities and achieve milestones</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Stake & Earn</h4>
                    <p className="text-xs text-muted-foreground">Put your money where your goals are</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-card to-card/50 border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Trophy className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Win Rewards</h4>
                    <p className="text-xs text-muted-foreground">Complete goals and claim your stake</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Stats overview */}
            <Card className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Your Active Challenges</h3>
                    <p className="text-sm text-muted-foreground">
                      Keep pushing! You're participating in {userChallenges.length} challenge{userChallenges.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                    {userChallenges.filter(c => isChallengeActive(c.startDate, c.endDate)).length} Active
                  </Badge>
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                    {userChallenges.filter(c => isChallengeUpcoming(c.startDate)).length} Upcoming
                  </Badge>
                  <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 border-gray-500/20">
                    {userChallenges.filter(c => isChallengeCompleted(c.endDate)).length} Completed
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Challenges list */}
            {userChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge as Challenge}
                isParticipating={true}
              />
            ))}

            {/* Floating create button - only shown when there are challenges */}
            <Link to="/create">
              <Button
                size="lg"
                className="fixed bottom-24 right-6 h-14 w-14 shadow-glow bg-gradient-primary hover:opacity-90"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;