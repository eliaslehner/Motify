// pages/CreateChallenge.tsx
import { ArrowLeft, Calendar, DollarSign, Target, Heart, Wallet, Info, TrendingUp, CalendarIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, MOTIFY_ABI } from "@/contract";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const CreateChallenge = () => {
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const [beneficiary, setBeneficiary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTokenBalance, setUserTokenBalance] = useState(100);
  const [stakeAmount, setStakeAmount] = useState("");
  const [tokensToUse, setTokensToUse] = useState("");
  const [apiProvider, setApiProvider] = useState("");
  const [activityType, setActivityType] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // Auto-load current time for start, and current time + 1 hour for end
  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const getEndTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const [startTime, setStartTime] = useState(getCurrentTime());
  const [endTime, setEndTime] = useState(getEndTime());
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    goal: "",
    contractAddress: "",
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  useEffect(() => {
    if (error) {
      console.error("Transaction error:", error);
      toast.error("Transaction failed: " + error.message);
      setIsSubmitting(false);
    }
  }, [error]);

  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success("Challenge created on blockchain!");
      saveToBackend();
    }
  }, [isConfirmed, hash]);

  const saveToBackend = async () => {
    try {
      if (!startDate || !endDate) {
        toast.error("Invalid dates");
        return;
      }

      // Combine date and time
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startDateTime = new Date(startDate);
      startDateTime.setHours(startHour, startMinute, 0, 0);

      const endDateTime = new Date(endDate);
      endDateTime.setHours(endHour, endMinute, 59, 999);

      let contractAddress = formData.contractAddress;
      if (beneficiary !== "friend") {
        contractAddress = charityWallets[beneficiary] || contractAddress;
      }

      const challenge = await apiService.createChallenge({
        name: formData.name,
        description: formData.description,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        contract_address: contractAddress,
        goal: formData.goal,
        api_provider: apiProvider as 'strava' | 'github',
      });

      toast.success("Challenge created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error saving challenge to backend:", error);
      toast.error("Challenge created on blockchain but failed to save locally.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet?.address) {
      toast.error("Wallet not connected. Please refresh and try again.");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    // Combine date and time
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMinute, 59, 999);

    if (endDateTime <= startDateTime) {
      toast.error("End date and time must be after start date and time");
      return;
    }

    setIsSubmitting(true);

    try {
      let charityAddress = formData.contractAddress;
      if (beneficiary !== "friend") {
        charityAddress = charityWallets[beneficiary] || charityAddress;
      }

      if (!charityAddress || charityAddress === "") {
        toast.error("Please provide a valid beneficiary address");
        setIsSubmitting(false);
        return;
      }

      const endTimeTimestamp = Math.floor(endDateTime.getTime() / 1000);

      toast.info("Please confirm the transaction in your wallet...");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: MOTIFY_ABI,
        functionName: "createChallenge",
        args: [charityAddress, BigInt(endTimeTimestamp)],
      } as any);

    } catch (error) {
      console.error("Error creating challenge:", error);
      toast.error("Failed to create challenge. Please try again.");
      setIsSubmitting(false);
    }
  };

  const calculateDuration = () => {
    if (!startDate || !endDate) return null;

    // Combine date and time for accurate duration
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    const diffMs = endDateTime.getTime() - startDateTime.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0 && hours > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'} ${hours}h`;
    } else if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    } else if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return null;
  };

  const finalAmount = Math.max(0, (parseFloat(stakeAmount) || 0) - (parseFloat(tokensToUse) || 0) * 0.1);
  const duration = calculateDuration();

  // Charity wallet addresses mapping
  const charityWallets: Record<string, string> = {
    charity1: "0x1111111111111111111111111111111111111111",
    charity2: "0x2222222222222222222222222222222222222222",
    charity3: "0x3333333333333333333333333333333333333333",
  };

  // Get available activity types based on selected API provider
  const getActivityTypes = () => {
    if (apiProvider === "strava") {
      return [
        { value: "steps", label: "Steps (Walking)", icon: "🚶" },
        { value: "distance-run", label: "Distance (Running)", icon: "🏃" },
        { value: "distance-ride", label: "Distance (Cycling)", icon: "🚴" },
      ];
    } else if (apiProvider === "github") {
      return [
        { value: "commits", label: "Commits", icon: "💻" },
        { value: "pull-requests", label: "Pull Requests", icon: "🔀" },
        { value: "issues", label: "Issues Fixed", icon: "🐛" },
      ];
    }
    return [];
  };

  // Update end time when start time changes to ensure it's at least 1 minute later
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);

    // If dates are the same, ensure end time is after start time
    if (startDate && endDate && startDate.toDateString() === endDate.toDateString()) {
      const [startHour, startMinute] = newStartTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      if (endMinutes <= startMinutes) {
        // Set end time to 1 hour after start time
        const newEndMinutes = startMinutes + 60;
        const newEndHour = Math.floor(newEndMinutes / 60) % 24;
        const newEndMinute = newEndMinutes % 60;
        setEndTime(`${newEndHour.toString().padStart(2, '0')}:${newEndMinute.toString().padStart(2, '0')}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Create Challenge</h1>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information Card */}
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}></div>
            </div>

            <div className="relative space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Basic Information</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Challenge Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., 10,000 Steps Challenge"
                  required
                  className="bg-background"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what participants need to achieve..."
                  required
                  maxLength={160}
                  className="bg-background min-h-[100px] resize-none"
                  value={formData.description}
                  onChange={handleInputChange}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Be clear about the challenge requirements and expectations
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formData.description.length}/160
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* API Provider & Activity Type Card */}
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}></div>
            </div>

            <div className="relative space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold text-lg">Activity & Goal</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiProvider">API Provider</Label>
                <Select
                  required
                  onValueChange={(value) => {
                    setApiProvider(value);
                    setActivityType(""); // Reset activity type when provider changes
                  }}
                  value={apiProvider}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select API provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strava">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                          S
                        </div>
                        <span>Strava</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="github">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-800 dark:bg-gray-200 flex items-center justify-center text-white dark:text-gray-800 text-xs font-bold">
                          G
                        </div>
                        <span>GitHub</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {apiProvider && (
                <div className="space-y-2">
                  <Label htmlFor="activityType">Activity Type</Label>
                  <Select required onValueChange={setActivityType} value={activityType}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getActivityTypes().map((activity) => (
                        <SelectItem key={activity.value} value={activity.value}>
                          <div className="flex items-center gap-2">
                            <span>{activity.icon}</span>
                            <span>{activity.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="goal">Daily Goal</Label>
                <Input
                  id="goal"
                  type="number"
                  placeholder="e.g., 10000"
                  required
                  className="bg-background"
                  value={formData.goal}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  The target value participants must achieve each day
                </p>
              </div>
            </div>
          </Card>

          {/* Timeline Card */}
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}></div>
            </div>

            <div className="relative space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Timeline</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                  <TimePicker value={startTime} onChange={handleStartTimeChange} />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        disabled={(date) => {
                          const today = new Date(new Date().setHours(0, 0, 0, 0));
                          if (date < today) return true;
                          if (startDate && date < startDate) return true;
                          return false;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <TimePicker value={endTime} onChange={setEndTime} />
                </div>
              </div>

              {duration && (
                <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/50">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border border-orange-500/20">
                    {duration}
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Stake & Beneficiary Card */}
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}></div>
            </div>

            <div className="relative space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-lg">Stake & Beneficiary</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stake">Stake Amount (USDC)</Label>
                <Input
                  id="stake"
                  type="number"
                  placeholder="100"
                  step="0.01"
                  min="0.00001"
                  className="bg-background"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Amount each participant will stake when joining (min: 0.00001 USDC)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beneficiary">Failure Beneficiary</Label>
                <Select required onValueChange={setBeneficiary} value={beneficiary}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Where should failed stakes go?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="charity1">
                      <div className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-red-500" />
                        Red Cross
                      </div>
                    </SelectItem>
                    <SelectItem value="charity2">
                      <div className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-red-500" />
                        UNICEF
                      </div>
                    </SelectItem>
                    <SelectItem value="charity3">
                      <div className="flex items-center gap-2">
                        <Heart className="h-3 w-3 text-red-500" />
                        WWF
                      </div>
                    </SelectItem>
                    <SelectItem value="friend">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-3 w-3" />
                        Custom Address
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Failed stakes will be sent to this beneficiary
                </p>
              </div>

              {beneficiary === "friend" && (
                <div className="space-y-2 p-4 bg-background/50 rounded-lg border border-border/50">
                  <Label htmlFor="contractAddress">Beneficiary Wallet Address</Label>
                  <Input
                    id="contractAddress"
                    placeholder="0x..."
                    required
                    className="bg-background font-mono text-sm"
                    value={formData.contractAddress}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter a valid Ethereum address
                  </p>
                </div>
              )}

              {beneficiary && beneficiary !== "friend" && (
                <div className="space-y-2 p-4 bg-background/50 rounded-lg border border-border/50">
                  <Label htmlFor="charityAddress">Charity Wallet Address</Label>
                  <Input
                    id="charityAddress"
                    value={charityWallets[beneficiary]}
                    readOnly
                    className="bg-muted font-mono text-sm cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    This is the verified charity wallet address where failed stakes will be sent
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Token Discount Card */}
          <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-purple-500/0 border-purple-500/20 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}></div>
            </div>

            <div className="relative space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-base">Use Tokens for Discount</h3>
                  <p className="text-xs text-muted-foreground">1 MOTIFY token = 0.1 USDC reduction</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-background/50 rounded-lg border border-purple-500/10">
                  <Label className="text-xs text-muted-foreground">Available Tokens</Label>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{userTokenBalance}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">MOTIFY</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tokensToUse" className="text-xs text-muted-foreground">Use Tokens</Label>
                  <Input
                    id="tokensToUse"
                    type="number"
                    placeholder="0"
                    step="1"
                    min="0"
                    max={userTokenBalance}
                    className="bg-background"
                    value={tokensToUse}
                    onChange={(e) => {
                      const value = Math.min(
                        parseInt(e.target.value) || 0,
                        userTokenBalance
                      );
                      setTokensToUse(value.toString());
                    }}
                  />
                </div>
              </div>

              {(stakeAmount || tokensToUse) && (
                <div className="p-4 rounded-lg bg-background/50 border border-purple-500/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original Stake</span>
                    <span className="font-medium">{stakeAmount || '0'} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Token Discount</span>
                    <span className="font-medium text-purple-600">-{((parseFloat(tokensToUse) || 0) * 0.1).toFixed(2)} USDC</span>
                  </div>
                  <div className="h-px bg-border/30 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Final Amount</span>
                    <span className="text-xl font-bold text-primary">{finalAmount.toFixed(2)} USDC</span>
                  </div>
                </div>
              )}

              {!(stakeAmount || tokensToUse) && (
                <div className="p-4 rounded-lg bg-background/50 border border-purple-500/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original Stake</span>
                    <span className="font-medium">0 USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Token Discount</span>
                    <span className="font-medium text-purple-600">-0.00 USDC</span>
                  </div>
                  <div className="h-px bg-border/30 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Final Amount</span>
                    <span className="text-xl font-bold text-primary">0.00 USDC</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Summary Card */}
          {formData.name && formData.goal && duration && stakeAmount && (
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/0 border-primary/20">
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Challenge Summary</h3>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Challenge</span>
                    <span className="font-medium text-right">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Goal</span>
                    <span className="font-medium">{formData.goal} {activityType === 'steps' ? 'steps' : activityType === 'commits' ? 'commits' : 'units'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stake per Person</span>
                    <span className="font-medium">{finalAmount.toFixed(2)} USDC</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
            size="lg"
            disabled={isSubmitting || isPending || isConfirming}
          >
            {isPending
              ? "Confirm in Wallet..."
              : isConfirming
                ? "Creating on Blockchain..."
                : isSubmitting
                  ? "Finalizing..."
                  : "Create Challenge"}
          </Button>

          {hash && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground font-mono">
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default CreateChallenge;