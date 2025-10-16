// pages/Home.tsx
import { useState, useEffect } from "react";
import { Plus, Users, Coins, Check, TrendingUp, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, Challenge, isChallengeUpcoming, isChallengeCompleted, isChallengeActive } from "@/services/api";
import { toast } from "sonner";
import { WebLogin } from "@/components/WebLogin";

const Home = () => {
  const { user, wallet, isLoading: authLoading, isInMiniApp, isAuthenticated } = useAuth();
  const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [challengeProgresses, setChallengeProgresses] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadChallenges();
  }, [wallet?.address]);

  const loadChallenges = async () => {
    try {
      setLoadingChallenges(true);

      if (wallet?.address) {
        const userChallengesData = await apiService.getUserChallenges(wallet.address);
        setUserChallenges(userChallengesData);

        const progressPromises = userChallengesData
          .filter(challenge => isChallengeCompleted(challenge.endDate))
          .map(async (challenge) => {
            const progress = await apiService.getChallengeProgress(challenge.id, wallet.address, 1000);
            return { challengeId: challenge.id, succeeded: progress?.currentlySucceeded || false };
          });

        const progressResults = await Promise.all(progressPromises);
        const progressMap = progressResults.reduce((acc, result) => {
          acc[result.challengeId] = result.succeeded;
          return acc;
        }, {} as Record<number, boolean>);

        setChallengeProgresses(progressMap);
      }
    } catch (error) {
      console.error('Failed to load challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoadingChallenges(false);
    }
  };

  const getServiceInfo = (challenge: Challenge) => {
    const titleLower = challenge.title.toLowerCase();
    const descLower = challenge.description.toLowerCase();
    
    if (titleLower.includes('strava') || titleLower.includes('steps') || titleLower.includes('run') || titleLower.includes('walk')) {
      return { name: 'STRAVA', logo: '/strava_logo.svg', color: 'bg-orange-500' };
    }
    
    if (titleLower.includes('github') || titleLower.includes('commit') || descLower.includes('github')) {
      return { name: 'GITHUB', logo: '/github-white.svg', color: 'bg-black' };
    }
    
    return { name: 'CUSTOM', logo: null, color: 'bg-primary' };
  };

  const getStatusBadge = (challenge: Challenge, isUserJoined: boolean) => {
    const { originalStartDate, originalEndDate } = challenge;

    if (isChallengeUpcoming(originalStartDate)) {
      return (
        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border border-orange-500/20 font-medium">
          Upcoming
        </Badge>
      );
    }

    if (isChallengeCompleted(originalEndDate)) {
      if (isUserJoined) {
        const succeeded = challengeProgresses[challenge.id];
        if (succeeded) {
          return (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border border-green-500/20 font-medium">
              Completed
            </Badge>
          );
        } else {
          return (
            <Badge variant="secondary" className="bg-red-500/10 text-red-600 border border-red-500/20 font-medium">
              Failed
            </Badge>
          );
        }
      } else {
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 border border-gray-500/20 font-medium">
            Ended
          </Badge>
        );
      }
    }

    if (isChallengeActive(originalStartDate, originalEndDate)) {
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

  const ChallengeCard = ({ challenge, isUserJoined }: { challenge: Challenge; isUserJoined: boolean }) => {
    const serviceInfo = getServiceInfo(challenge);
    const isGithub = serviceInfo.name === 'GITHUB';
    
    return (
      <Link to={`/challenge/${challenge.id}`} className="block group">
        <Card className="p-5 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-card to-card/50 border-border/50 hover:border-primary/20 relative overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }}></div>
          </div>

          <div className="relative">
            {/* Header Row */}
            <div className="flex items-start justify-between mb-4">
              {/* Service Logo and Name */}
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${serviceInfo.color} flex items-center justify-center shadow-md overflow-hidden shrink-0 aspect-square transform-gpu ${isGithub ? 'border-2 border-black' : ''}`}>
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
                  <span className="text-xs font-semibold text-muted-foreground tracking-wider">{serviceInfo.name}</span>
                  <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">{challenge.title}</h3>
                </div>
              </div>

              {/* Status and Participation Badge */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {getStatusBadge(challenge, isUserJoined)}
                {isUserJoined && (
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {challenge.description}
            </p>

            {/* Stats Row */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              {/* Duration */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                <span className="font-medium">{challenge.duration}</span>
              </div>

              {/* Participants and Stake */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">{challenge.participants}</span>
                  {challenge.isCharity && (
                    <Heart className="w-3 h-3 text-red-500/70 fill-red-500/20 ml-1" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
                  <Coins className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-semibold text-primary">{challenge.stake.toFixed(3)} USDC</span>
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome back! 👋</h1>
            <p className="text-sm text-muted-foreground">Your personal challenges await</p>
          </div>
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={user?.pfpUrl || "/placeholder.svg"}
              alt={user?.displayName || "Profile"}
              className="object-cover"
            />
            <AvatarFallback>
              {user?.displayName?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {loadingChallenges ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your challenges...</p>
            </div>
          </div>
        ) : !wallet?.isConnected ? (
          <Card className="p-8 text-center bg-gradient-card border-border">
            <p className="text-muted-foreground mb-4">Connect your wallet to see your challenges.</p>
            <p className="text-sm text-muted-foreground mb-4">Or explore challenges in the Discover tab.</p>
          </Card>
        ) : userChallenges.length === 0 ? (
          <Card className="p-8 text-center bg-gradient-card border-border">
            <p className="text-muted-foreground mb-4">You haven't joined any challenges yet.</p>
            <Link to="/discover">
              <Button className="bg-gradient-primary">Discover Challenges</Button>
            </Link>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold">My Challenges</h2>
            {userChallenges.map((challenge) => {
              const isUserJoined = wallet?.address
                ? apiService.isUserParticipating(challenge, wallet.address)
                : false;

              return (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  isUserJoined={isUserJoined}
                />
              );
            })}
          </div>
        )}
      </main>

      <Link to="/create">
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 shadow-glow bg-gradient-primary hover:opacity-90"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
};

export default Home;