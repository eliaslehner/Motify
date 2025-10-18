// pages/Profile.tsx
import { Trophy, Target, DollarSign, TrendingUp, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { apiService, UserStats, TokenConfig } from "@/services/api";

const Profile = () => {
  const { user, wallet, isLoading } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [platformTokens, setPlatformTokens] = useState<TokenConfig | null>(null);

  useEffect(() => {
    if (wallet?.address) {
      loadUserData();
    }
  }, [wallet?.address]);

  const loadUserData = async () => {
    if (!wallet?.address) return;

    try {
      setLoadingData(true);
      const [statsData, tokenData] = await Promise.all([
        apiService.getUserStats(wallet.address),
        apiService.getTokenBalance(wallet.address),
      ]);
      setUserStats(statsData);
      setPlatformTokens(tokenData);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const stats = userStats ? [
    {
      icon: Trophy,
      label: "Succeeded",
      value: userStats.totalChallengesSucceeded.toString(),
      color: "text-success",
      bgColor: "bg-success-light",
    },
    {
      icon: Target,
      label: "Participated",
      value: userStats.totalChallengesParticipated.toString(),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: DollarSign,
      label: "Total Contributed",
      value: `${userStats.totalAmountContributedUsd.toFixed(4)} USDC`,
      color: "text-warning",
      bgColor: "bg-warning-light",
    },
    {
      icon: TrendingUp,
      label: "Success Rate",
      value: userStats.totalChallengesParticipated > 0
        ? `${Math.round((userStats.totalChallengesSucceeded / userStats.totalChallengesParticipated) * 100)}%`
        : "0%",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ] : [
    {
      icon: Trophy,
      label: "Succeeded",
      value: "0",
      color: "text-success",
      bgColor: "bg-success-light",
    },
    {
      icon: Target,
      label: "Participated",
      value: "0",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: DollarSign,
      label: "Total Contributed",
      value: "0 USDC",
      color: "text-warning",
      bgColor: "bg-warning-light",
    },
    {
      icon: TrendingUp,
      label: "Success Rate",
      value: "0%",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading profile...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Profile Info */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage
                  src={user?.pfpUrl || "/placeholder.svg"}
                  alt={user?.displayName || "Profile"}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl">
                  {user?.displayName?.substring(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">
                  {user?.displayName || "Anonymous User"}
                </h2>
                <p className="text-sm text-muted-foreground mb-1">
                  @{user?.username || "user"}
                </p>
                {wallet?.address && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
                  </p>
                )}
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Token Balance Card */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0">
                  <Coins className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-600 mb-1">Platform Tokens</p>
                  <h3 className="text-2xl font-bold">
                    {platformTokens ? platformTokens.balance.toFixed(1) : '0.0'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {platformTokens?.name || 'MOTIFY'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Use tokens to reduce USDC fees on new challenges
                {platformTokens && platformTokens.reductionRate > 0 && (
                  <span className="block mt-1">
                    1 token = {platformTokens.reductionRate.toFixed(2)} USDC reduction
                  </span>
                )}
              </p>
            </Card>

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
          </>
        )}
      </main>
    </div>
  );
};

export default Profile;
