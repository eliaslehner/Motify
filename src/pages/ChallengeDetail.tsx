import { ArrowLeft, Calendar, DollarSign, Users, Trophy, Target } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

const ChallengeDetail = () => {
  const { id } = useParams();

  // Mock data
  const challenge = {
    title: "Run 50km This Month",
    description: "Challenge yourself to run 50 kilometers over the next 30 days. Track your progress through Strava integration and prove your commitment!",
    stake: 100,
    participants: 12,
    duration: "15 days left",
    startDate: "Jan 1, 2025",
    endDate: "Jan 31, 2025",
    progress: 45,
    currentProgress: "22.5 km",
    goal: "50 km",
    active: true,
    isParticipating: false, // Set to true if user is already in this challenge
  };

  const participants = [
    { name: "Alice", avatar: "/placeholder.svg", progress: 65 },
    { name: "Bob", avatar: "/placeholder.svg", progress: 45 },
    { name: "Charlie", avatar: "/placeholder.svg", progress: 30 },
    { name: "Diana", avatar: "/placeholder.svg", progress: 80 },
  ];

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

      {/* Active Badge */}
      {challenge.active && (
        <div className="container mx-auto px-4 pt-4">
          <Badge variant="secondary" className="bg-success-light text-success">
            Active
          </Badge>
        </div>
      )}

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

        {/* Progress Card */}
        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Your Progress</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current</span>
              <span className="font-medium">{challenge.currentProgress} / {challenge.goal}</span>
            </div>
            <Progress value={challenge.progress} className="h-3" />
          </div>
          <p className="text-sm text-muted-foreground">{challenge.progress}% complete</p>
        </Card>

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

        {/* Participants Card */}
        <Card className="p-6 bg-gradient-card border-border">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-success" />
            <h3 className="font-semibold text-lg">Leaderboard</h3>
          </div>
          <div className="space-y-4">
            {participants.map((participant, index) => (
              <div key={index} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={participant.avatar} alt={participant.name} />
                  <AvatarFallback>{participant.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{participant.name}</p>
                  <Progress value={participant.progress} className="h-2 mt-1" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {participant.progress}%
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Action Button - Only show if user is not participating */}
        {!challenge.isParticipating && (
          <Button
            className="w-full bg-gradient-primary hover:opacity-90"
            size="lg"
          >
            Join Challenge
          </Button>
        )}
      </main>
    </div>
  );
};

export default ChallengeDetail;
