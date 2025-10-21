import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { ChallengeCard, Challenge } from "@/components/ChallengeCard";
import { calculateDuration, isChallengeUpcoming, isChallengeActive, isChallengeCompleted } from "@/utils/challengeHelpers";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, MOTIFY_ABI } from "@/contract";

type SortOption = "ending-soon" | "most-popular" | "newest";
type StatusFilter = "all" | "active" | "upcoming" | "completed";
type ParticipationFilter = "all" | "not-participating";

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

interface DiscoverChallenge {
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

const Discover = () => {
  const { wallet } = useAuth();
  const [challenges, setChallenges] = useState<DiscoverChallenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<DiscoverChallenge[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [participationFilter, setParticipationFilter] = useState<ParticipationFilter>("not-participating");
  const [userChallengeIds, setUserChallengeIds] = useState<Set<number>>(new Set());

  // Read challenges from blockchain
  const { data: blockchainChallenges, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MOTIFY_ABI,
    functionName: 'getAllChallenges',
    args: [BigInt(100)], // Get up to 100 challenges
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
      refetchOnWindowFocus: true, // Refetch when user returns to tab
    }
  });

  // Read user's participating challenges
  const { data: userChallenges, isLoading: loadingUserChallenges } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: MOTIFY_ABI,
    functionName: 'getChallengesForParticipant',
    args: wallet?.address ? [wallet.address as `0x${string}`] : undefined,
    query: {
      enabled: !!wallet?.address,
      refetchInterval: 10000, // Refetch every 10 seconds
      refetchOnWindowFocus: true, // Refetch when user returns to tab
    }
  });

  // Extract user's challenge IDs
  useEffect(() => {
    if (userChallenges) {
      const ids = new Set(
        (userChallenges as BlockchainChallenge[]).map(bc => Number(bc.challengeId))
      );
      setUserChallengeIds(ids);
    } else {
      setUserChallengeIds(new Set());
    }
  }, [userChallenges]);

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
      setChallenges(formattedChallenges);
    }
  }, [blockchainChallenges]);

  useEffect(() => {
    filterAndSortChallenges();
  }, [challenges, sortBy, statusFilter, participationFilter, userChallengeIds]);

  const filterAndSortChallenges = () => {
    let filtered = [...challenges];

    // Apply participation filter
    if (wallet?.address && participationFilter === "not-participating") {
      filtered = filtered.filter((challenge) => {
        return !userChallengeIds.has(challenge.id);
      });
    }

    // Apply status filter
    filtered = filtered.filter((challenge) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active")
        return isChallengeActive(challenge.startDate, challenge.endDate);
      if (statusFilter === "upcoming")
        return isChallengeUpcoming(challenge.startDate);
      if (statusFilter === "completed")
        return isChallengeCompleted(challenge.endDate);
      return true;
    });

    // Apply sorting
    switch (sortBy) {
      case "ending-soon":
        filtered.sort(
          (a, b) => a.endDate.getTime() - b.endDate.getTime()
        );
        break;
      case "most-popular":
        filtered.sort((a, b) => b.participants - a.participants);
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) => b.startDate.getTime() - a.startDate.getTime()
        );
        break;
    }

    setFilteredChallenges(filtered);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <PageHeader title="Discover" />

      {/* Controls */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {/* Participation Filter - Only show when wallet is connected */}
            {wallet?.address && (
              <Select value={participationFilter} onValueChange={(value) => setParticipationFilter(value as ParticipationFilter)}>
                <SelectTrigger className="w-40 bg-background">
                  <SelectValue placeholder="Filter by participation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not-participating">Not Joined</SelectItem>
                  <SelectItem value="all">All Challenges</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="w-40 bg-background">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-40 bg-background">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="most-popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <main className="container mx-auto px-4 py-6">
        {isLoading || loadingUserChallenges ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading challenges...</p>
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
        ) : filteredChallenges.length === 0 ? (
          <Card className="p-8 text-center bg-gradient-to-br from-card to-card/50 border-border/50">
            <p className="text-muted-foreground mb-4">
              No challenges found matching your filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter("all");
                setSortBy("newest");
                setParticipationFilter("not-participating");
              }}
            >
              Reset Filters
            </Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredChallenges.length} of {challenges.length} challenges
            </div>
            {filteredChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge as Challenge}
                isParticipating={userChallengeIds.has(challenge.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Discover;
