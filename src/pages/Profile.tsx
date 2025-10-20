// pages/Profile.tsx
import { Trophy, Target, DollarSign, TrendingUp, Coins } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { apiService, UserStats } from "@/services/api";
import { useReadContract, useAccount } from "wagmi";
import { CONTRACTS, ABIS } from "@/contract";
import { formatUnits } from "viem";

const Profile = () => {
  const { user, wallet, isLoading } = useAuth();
  const { address } = useAccount();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Read Motify token balance from blockchain
  const { data: tokenBalanceData, isLoading: tokenBalanceLoading } = useReadContract({
    address: CONTRACTS.MOTIFY_TOKEN,
    abi: ABIS.MOTIFY_TOKEN,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  } as any);

  // Fetch user stats from API
  useEffect(() => {
    if (wallet?.address || address) {
      loadUserStats();
    }
  }, [wallet?.address, address]);

  const loadUserStats = async () => {
    const userAddress = address || wallet?.address;
    if (!userAddress) return;

    try {
      setLoadingStats(true);
      const statsData = await apiService.getUserStats(userAddress);
      setUserStats(statsData);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Convert token balance from bigint to number
  const tokenBalance = tokenBalanceData ? parseFloat(formatUnits(tokenBalanceData as bigint, 18)) : 0;

  // Token reduction rate: 10,000 tokens = 1 USDC
  const tokenReductionRate = 0.0001; // 1 token = 0.0001 USDC

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
  ] : [];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-6">
            {/* Profile Info Skeleton */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>

            <Separator className="my-6" />

            {/* Token Card Skeleton */}
            <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <div className="flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-10 w-full mt-3" />
            </Card>

            {/* Stats Skeleton */}
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="p-4 bg-gradient-card border-border">
                    <Skeleton className="w-10 h-10 rounded-lg mb-3" />
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Profile Info */}
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage
                  src={user?.pfpUrl}
                  alt={user?.displayName || "Profile"}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
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
                {(wallet?.address || address) && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {(address || wallet?.address)?.substring(0, 6)}...{(address || wallet?.address)?.substring((address || wallet?.address)!.length - 4)}
                  </p>
                )}
              </div>
            </div>

            <Separator className="mb-6" />

            {/* Token Balance Card */}
            <Card className="p-6 mb-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              {tokenBalanceLoading ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-14 h-14 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-8 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Coins className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-600 mb-1">Platform Tokens</p>
                      <h3 className="text-2xl font-bold">
                        {tokenBalance.toFixed(1)}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        MOTIFY
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Use tokens to reduce USDC fees on new challenges
                    <span className="block mt-1">
                      {tokenReductionRate > 0
                        ? `1 token = ${tokenReductionRate.toFixed(4)} USDC reduction`
                        : '\u00A0'}
                    </span>
                  </p>
                </>
              )}
            </Card>

            {/* Stats Dashboard */}
            <h2 className="text-xl font-semibold mb-4">Your Stats</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {loadingStats ? (
                // Skeleton loaders for stats
                Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="p-4 bg-gradient-card border-border">
                    <Skeleton className="w-10 h-10 rounded-lg mb-3" />
                    <Skeleton className="h-3 w-20 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </Card>
                ))
              ) : (
                stats.map((stat, index) => (
                  <Card key={index} className="p-4 bg-gradient-card border-border">
                    <div className={`${stat.bgColor} ${stat.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </Card>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Profile;
