// pages/Home.tsx
import { useState, useEffect } from "react";
import { Plus, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { WebLogin } from "@/components/WebLogin";
import { WalletStatus } from "@/components/WalletStatus";
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

interface Challenge {
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
  const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);

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

  const calculateDuration = (start: Date, end: Date): string => {
    const diffMs = end.getTime() - start.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0 && hours > 0) {
      return `${days}d ${hours}h`;
    } else if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return '< 1h';
  };

  const isChallengeUpcoming = (startDate: Date): boolean => {
    return startDate.getTime() > Date.now();
  };

  const isChallengeActive = (startDate: Date, endDate: Date): boolean => {
    const now = Date.now();
    return startDate.getTime() <= now && endDate.getTime() > now;
  };

  const isChallengeCompleted = (endDate: Date): boolean => {
    return endDate.getTime() <= Date.now();
  };

  const getStatusBadge = (challenge: Challenge) => {
    if (isChallengeUpcoming(challenge.startDate)) {
      return (
        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border border-orange-500/20 font-medium">
          Upcoming
        </Badge>
      );
    }
    if (isChallengeCompleted(challenge.endDate)) {
      return (
        <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 border border-gray-500/20 font-medium">
          Ended
        </Badge>
      );
    }
    if (isChallengeActive(challenge.startDate, challenge.endDate)) {
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

  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
    const serviceInfo = {
      name: challenge.serviceType.toUpperCase(),
      logo: challenge.serviceType === 'strava' ? '/strava_logo.svg' : challenge.serviceType === 'github' ? '/github-white.svg' : null,
      color: challenge.serviceType === 'strava' ? 'bg-orange-500' : challenge.serviceType === 'github' ? 'bg-black' : 'bg-primary'
    };
    const isGithub = serviceInfo.name === "GITHUB";

    return (
      <Link to={`/challenge/${challenge.id}`} className="block group">
        <Card className="p-5 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            ></div>
          </div>

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full ${serviceInfo.color} flex items-center justify-center shadow-md overflow-hidden shrink-0 aspect-square transform-gpu ${isGithub ? "border-2 border-black" : ""
                    }`}
                >
                  {serviceInfo.logo ? (
                    <img
                      src={serviceInfo.logo}
                      alt={serviceInfo.name}
                      className="block w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <TrendingUp className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-muted-foreground tracking-wider">
                    {serviceInfo.name}
                  </span>
                  <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
                    {challenge.title}
                  </h3>
                </div>
              </div>
              {/* Status Badge */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {getStatusBadge(challenge)}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {challenge.description}
            </p>
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span className="font-medium">{challenge.duration}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">
                    {challenge.participants}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  if (!isInMiniApp && !isAuthenticated && !authLoading) {
    return <WebLogin />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Home</h1>
            <p className="text-sm text-muted-foreground">Give it your all!</p>
          </div>
        </div>
      </header>

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
                challenge={challenge}
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