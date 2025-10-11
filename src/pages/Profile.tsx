import { X, Trophy, Target, DollarSign, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const Profile = () => {
  const stats = [
    {
      icon: Trophy,
      label: "Completed",
      value: "12",
      color: "text-success",
      bgColor: "bg-success-light",
    },
    {
      icon: Target,
      label: "Active",
      value: "3",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: DollarSign,
      label: "Total Staked",
      value: "$450",
      color: "text-warning",
      bgColor: "bg-warning-light",
    },
    {
      icon: TrendingUp,
      label: "Success Rate",
      value: "75%",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Link to="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Profile Info */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-24 w-24 border-2 border-border">
            <AvatarImage src="/placeholder.svg" alt="Profile" />
            <AvatarFallback className="text-2xl">JD</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">John Doe</h2>
            <p className="text-sm text-muted-foreground font-mono">0x742d...5f8a</p>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Stats Dashboard */}
        <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="p-4 bg-gradient-card border-border">
              <div className={`${stat.bgColor} ${stat.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </Card>
          ))}
        </div>

        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { title: "Completed: Run 50km", date: "2 days ago", status: "success" },
            { title: "Failed: 100 Commits", date: "1 week ago", status: "failed" },
            { title: "Completed: Read 5 Books", date: "2 weeks ago", status: "success" },
          ].map((activity, index) => (
            <Card key={index} className="p-4 bg-gradient-card border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{activity.title}</h3>
                  <p className="text-sm text-muted-foreground">{activity.date}</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === "success"
                      ? "bg-success-light text-success"
                      : "bg-destructive-light text-destructive"
                  }`}
                >
                  {activity.status === "success" ? "Won" : "Lost"}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Profile;
