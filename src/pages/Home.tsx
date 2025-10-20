// pages/Home.tsx
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { WebLogin } from "@/components/WebLogin";
import { WalletStatus } from "@/components/WalletStatus";
import { PageHeader } from "@/components/PageHeader";
import { ChallengeCard, Challenge } from "@/components/ChallengeCard";
import { calculateDuration } from "@/utils/challengeHelpers";
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
      <PageHeader title="Home" subtitle="Give it your all!" />

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
          <Card className="p-8 text-center bg-gradient-to-br from-card to-card/50 border-border/50">
            <p className="text-muted-foreground mb-4">You haven't joined any challenges yet.</p>
            <Link to="/discover">
              <Button className="bg-gradient-primary">Discover Challenges</Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {userChallenges.length} challenge{userChallenges.length !== 1 ? 's' : ''}
            </div>
            {userChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge as Challenge}
              />
            ))}
          </div>
        )}
      </main>

      <Link to="/create">
        <Button
          size="lg"
          className="fixed bottom-24 right-6 h-14 w-14 shadow-glow bg-gradient-primary hover:opacity-90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
};

export default Home;