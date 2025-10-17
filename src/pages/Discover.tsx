import { useState, useEffect } from "react";
import { Users, Coins, Check, TrendingUp, Heart, Sliders } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, Challenge, isChallengeUpcoming, isChallengeCompleted, isChallengeActive } from "@/services/api";
import { toast } from "sonner";

type SortOption = "stake-high" | "stake-low" | "ending-soon" | "most-popular" | "newest";
type StatusFilter = "all" | "active" | "upcoming" | "completed";

const Discover = () => {
  const { wallet } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [minStake, setMinStake] = useState<string>("");
  const [maxStake, setMaxStake] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadChallenges();
  }, [wallet?.address]);

  useEffect(() => {
    filterAndSortChallenges();
  }, [challenges, sortBy, statusFilter, minStake, maxStake]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const allChallenges = await apiService.getChallenges();
      setChallenges(allChallenges);
    } catch (error) {
      console.error("Failed to load challenges:", error);
      toast.error("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortChallenges = () => {
    let filtered = [...challenges];

    // Apply status filter
    filtered = filtered.filter((challenge) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "active")
        return isChallengeActive(
          challenge.originalStartDate,
          challenge.originalEndDate
        );
      if (statusFilter === "upcoming")
        return isChallengeUpcoming(challenge.originalStartDate);
      if (statusFilter === "completed")
        return isChallengeCompleted(challenge.originalEndDate);
      return true;
    });

    // Apply stake range filter
    if (minStake) {
      filtered = filtered.filter(
        (c) => c.stake >= parseFloat(minStake)
      );
    }
    if (maxStake) {
      filtered = filtered.filter(
        (c) => c.stake <= parseFloat(maxStake)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "stake-high":
        filtered.sort((a, b) => b.stake - a.stake);
        break;
      case "stake-low":
        filtered.sort((a, b) => a.stake - b.stake);
        break;
      case "ending-soon":
        filtered.sort(
          (a, b) =>
            new Date(a.originalEndDate).getTime() -
            new Date(b.originalEndDate).getTime()
        );
        break;
      case "most-popular":
        filtered.sort((a, b) => b.participants - a.participants);
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.originalStartDate).getTime() -
            new Date(a.originalStartDate).getTime()
        );
        break;
    }

    setFilteredChallenges(filtered);
  };

  const getServiceInfo = (challenge: Challenge) => {
    const titleLower = challenge.title.toLowerCase();
    const descLower = challenge.description.toLowerCase();

    if (
      titleLower.includes("strava") ||
      titleLower.includes("steps") ||
      titleLower.includes("run") ||
      titleLower.includes("walk")
    ) {
      return {
        name: "STRAVA",
        logo: "/strava_logo.svg",
        color: "bg-orange-500",
      };
    }

    if (
      titleLower.includes("github") ||
      titleLower.includes("commit") ||
      descLower.includes("github")
    ) {
      return { name: "GITHUB", logo: "/github-white.svg", color: "bg-black" };
    }

    return { name: "CUSTOM", logo: null, color: "bg-primary" };
  };

  const getStatusBadge = (challenge: Challenge) => {
    if (isChallengeUpcoming(challenge.originalStartDate)) {
      return (
        <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border border-orange-500/20 font-medium">
          Upcoming
        </Badge>
      );
    }

    if (isChallengeCompleted(challenge.originalEndDate)) {
      return (
        <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 border border-gray-500/20 font-medium">
          Ended
        </Badge>
      );
    }

    if (
      isChallengeActive(
        challenge.originalStartDate,
        challenge.originalEndDate
      )
    ) {
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
    const serviceInfo = getServiceInfo(challenge);
    const isGithub = serviceInfo.name === "GITHUB";
    const isUserJoined = wallet?.address 
      ? apiService.isUserParticipating(challenge, wallet.address)
      : false;

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
                  className={`w-12 h-12 rounded-full ${serviceInfo.color} flex items-center justify-center shadow-md overflow-hidden shrink-0 aspect-square transform-gpu ${
                    isGithub ? "border-2 border-black" : ""
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

              {/* Status and Participation Badge */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {getStatusBadge(challenge)}
                {/* DESIGN OPTION 1: Checkmark Circle (Current Implementation) - Clean, minimal, clear indicator */}
                {isUserJoined && (
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                
                {/* DESIGN OPTION 2: Badge with text
                {isUserJoined && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border border-green-500/20 font-medium text-xs">
                    Joined
                  </Badge>
                )}
                */}
                
                {/* DESIGN OPTION 3: Icon with tooltip
                {isUserJoined && (
                  <div className="flex items-center justify-center w-6 h-6 rounded bg-green-500/20" title="You're participating">
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </div>
                )}
                */}
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
                  {challenge.isCharity && (
                    <Heart className="w-3 h-3 text-red-500/70 fill-red-500/20 ml-1" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full">
                  <Coins className="h-3.5 w-3.5 text-primary" />
                  <span className="text-sm font-semibold text-primary">
                    {challenge.stake.toFixed(3)} USDC
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Discover</h1>
        </div>
      </header>

      {/* Controls */}
      <div className="sticky top-16 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 space-y-4">
          <div className="flex gap-2 flex-wrap">
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
                <SelectItem value="stake-high">Highest Stake</SelectItem>
                <SelectItem value="stake-low">Lowest Stake</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
                <SelectItem value="most-popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>

            {/* Advanced Filters */}
            <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Sliders className="h-4 w-4" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <div className="p-3 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Min Stake (USDC)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={minStake}
                      onChange={(e) => setMinStake(e.target.value)}
                      className="w-full mt-1 px-2 py-1 rounded border border-border bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Max Stake (USDC)
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      value={maxStake}
                      onChange={(e) => setMaxStake(e.target.value)}
                      className="w-full mt-1 px-2 py-1 rounded border border-border bg-background text-sm"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setMinStake("");
                      setMaxStake("");
                      setShowFilters(false);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {(minStake || maxStake) && (
            <div className="text-sm text-muted-foreground">
              Stake range: {minStake || "0"} - {maxStake || "∞"} USDC
            </div>
          )}
        </div>
      </div>

      {/* Challenges List */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading challenges...</p>
            </div>
          </div>
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
                setMinStake("");
                setMaxStake("");
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
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Discover;
