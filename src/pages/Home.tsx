import { useState } from "react";
import { Plus, User, TrendingUp, Users, Coins } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock data for challenges
const mockChallenges = [
  {
    id: 1,
    title: "Run 50km This Month",
    participants: 12,
    stake: 100,
    duration: "15 days left",
    type: "fitness",
    active: true,
  },
  {
    id: 2,
    title: "100 GitHub Commits",
    participants: 8,
    stake: 50,
    duration: "7 days left",
    type: "coding",
    active: true,
  },
  {
    id: 3,
    title: "Read 5 Books",
    participants: 24,
    stake: 75,
    duration: "21 days left",
    type: "education",
    active: false,
  },
];

const Home = () => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Home</h1>
          <Link to="/profile">
            <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src="/placeholder.svg" alt="Profile" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="all">All Challenges</TabsTrigger>
            <TabsTrigger value="my">My Challenges</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex flex-col gap-4 mt-0">
            {mockChallenges.map((challenge) => (
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
            ))}
          </TabsContent>

          <TabsContent value="my" className="flex flex-col gap-4 mt-0">
            {mockChallenges.slice(0, 2).map((challenge) => (
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
            ))}
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Action Button */}
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
