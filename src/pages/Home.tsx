import { useState, useEffect } from "react";
import { Plus, Users, Coins, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, Challenge, isChallengeUpcoming, isChallengeCompleted, isChallengeActive } from "@/services/api";
import { toast } from "sonner";
import { WebLogin } from "@/components/WebLogin";

const Home = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { user, wallet, isLoading: authLoading, isInMiniApp, isAuthenticated } = useAuth();
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);
  const [challengeProgresses, setChallengeProgresses] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadChallenges();
  }, [wallet?.address]);

  const loadChallenges = async () => {
    try {
      setLoadingChallenges(true);
      const challenges = await apiService.getChallenges();
      setAllChallenges(challenges);

      if (wallet?.address) {
        const userChallenges = await apiService.getUserChallenges(wallet.address);
        setUserChallenges(userChallenges);

        // Load progress for completed challenges where user participated
        const progressPromises = userChallenges
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

  const getStatusBadge = (challenge: Challenge, isUserJoined: boolean) => {
    // Use original dates for accurate time calculations
    const { originalStartDate, originalEndDate } = challenge;

    // Check if challenge is upcoming
    if (isChallengeUpcoming(originalStartDate)) {
      return (
        <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">
          Upcoming
        </Badge>
      );
    }

    // Check if challenge is completed
    if (isChallengeCompleted(originalEndDate)) {
      if (isUserJoined) {
        // User participated - check if they succeeded
        const succeeded = challengeProgresses[challenge.id];
        if (succeeded) {
          return (
            <Badge variant="secondary" className="bg-green-700/20 text-green-700">
              Done
            </Badge>
          );
        } else {
          return (
            <Badge variant="secondary" className="bg-red-500/20 text-red-500">
              Failed
            </Badge>
          );
        }
      } else {
        // User didn't participate - just show completed
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            Completed
          </Badge>
        );
      }
    }

    // Challenge is active
    if (isChallengeActive(originalStartDate, originalEndDate)) {
      return (
        <Badge variant="secondary" className="bg-success-light text-success">
          Active
        </Badge>
      );
    }

    return null;
  };

  if (!isInMiniApp && !isAuthenticated && !authLoading) {
    return <WebLogin />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Home</h1>
          <Link to="/profile">
            <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage
                src={user?.pfpUrl || "/placeholder.svg"}
                alt={user?.displayName || "Profile"}
                className="object-cover"
              />
              <AvatarFallback>
                {user?.displayName?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">All Challenges</TabsTrigger>
            <TabsTrigger value="my">My Challenges</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex flex-col gap-4 mt-0">
            {loadingChallenges ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading challenges...</p>
                </div>
              </div>
            ) : allChallenges.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-card border-border">
                <p className="text-muted-foreground mb-4">No challenges available yet.</p>
                <Link to="/create">
                  <Button className="bg-gradient-primary">Create First Challenge</Button>
                </Link>
              </Card>
            ) : (
              allChallenges.map((challenge) => {
                const isUserJoined = wallet?.address
                  ? apiService.isUserParticipating(challenge, wallet.address)
                  : false;

                return (
                  <Link key={challenge.id} to={`/challenge/${challenge.id}`} className="block">
                    <Card className="p-4 hover:shadow-md transition-all cursor-pointer bg-gradient-card border-border">
                      {/* First row: Title and badges */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-lg">{challenge.title}</h3>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(challenge, isUserJoined)}
                          {isUserJoined && (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success text-white">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Second row: Two columns */}
                      <div className="flex items-center justify-between">
                        {/* Left column: Duration and stats */}
                        <div className="flex flex-col gap-2">
                          <p className="text-sm text-muted-foreground">{challenge.duration}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-foreground font-medium">{challenge.participants}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Coins className="h-4 w-4 text-primary" />
                              <span className="text-foreground font-medium">{challenge.stake} ETH</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="my" className="flex flex-col gap-4 mt-0">
            {loadingChallenges ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading your challenges...</p>
                </div>
              </div>
            ) : !wallet?.isConnected ? (
              <Card className="p-8 text-center bg-gradient-card border-border">
                <p className="text-muted-foreground">Connect your wallet to see your challenges.</p>
              </Card>
            ) : userChallenges.length === 0 ? (
              <Card className="p-8 text-center bg-gradient-card border-border">
                <p className="text-muted-foreground mb-4">You haven't joined any challenges yet.</p>
                <Link to="/create">
                  <Button className="bg-gradient-primary">Create Your First Challenge</Button>
                </Link>
              </Card>
            ) : (
              userChallenges.map((challenge) => {
                const isUserJoined = wallet?.address
                  ? apiService.isUserParticipating(challenge, wallet.address)
                  : false;

                return (
                  <Link key={challenge.id} to={`/challenge/${challenge.id}`} className="block">
                    <Card className="p-4 hover:shadow-md transition-all cursor-pointer bg-gradient-card border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 mr-4">
                          <h3 className="font-semibold text-lg mb-1">{challenge.title}</h3>
                          <div className="flex flex-col gap-2">
                            <p className="text-sm text-muted-foreground">{challenge.duration}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground font-medium">{challenge.participants}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Coins className="h-4 w-4 text-primary" />
                                <span className="text-foreground font-medium">{challenge.stake} ETH</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(challenge, isUserJoined)}
                          {isUserJoined && (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success text-white">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })
            )}
          </TabsContent>
        </Tabs>
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
