import { useState, useEffect } from "react";
import { Plus, Users, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, Challenge } from "@/services/api";
import { toast } from "sonner";
import { WebLogin } from "@/components/WebLogin";

const Home = () => {
  const [activeTab, setActiveTab] = useState("all");
  const { user, wallet, isLoading: authLoading, isInMiniApp, isAuthenticated } = useAuth();
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

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
      }
    } catch (error) {
      console.error('Failed to load challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoadingChallenges(false);
    }
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
              allChallenges.map((challenge) => (
                <Link key={challenge.id} to={`/challenge/${challenge.id}`} className="block">
                  <Card className="p-4 hover:shadow-md transition-all cursor-pointer bg-gradient-card border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{challenge.title}</h3>
                        <p className="text-sm text-muted-foreground">{challenge.duration}</p>
                      </div>
                      {challenge.active && (
                        <Badge variant="secondary" className="bg-success-light text-success">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{challenge.participants}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-primary" />
                        <span className="text-foreground font-medium">{challenge.stake} USDC</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
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
              userChallenges.map((challenge) => (
                <Link key={challenge.id} to={`/challenge/${challenge.id}`} className="block">
                  <Card className="p-4 hover:shadow-md transition-all cursor-pointer bg-gradient-card border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{challenge.title}</h3>
                        <p className="text-sm text-muted-foreground">{challenge.duration}</p>
                      </div>
                      {challenge.active && (
                        <Badge variant="secondary" className="bg-success-light text-success">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{challenge.participants}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-primary" />
                        <span className="text-foreground font-medium">{challenge.stake} USDC</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
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
