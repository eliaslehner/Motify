// pages/CreateChallenge.tsx
import { ArrowLeft, Calendar, DollarSign, Target, Heart, Wallet, Info, TrendingUp, CalendarIcon, Github } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, MOTIFY_ABI } from "@/contract";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { wakatimeService } from "@/services/api";

const CreateChallenge = () => {
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const [beneficiary, setBeneficiary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiProvider, setApiProvider] = useState("");
  const [activityType, setActivityType] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [whitelistedAddresses, setWhitelistedAddresses] = useState("");
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
  const { isLoading: isConfirming, isSuccess: isConfirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    
    // Special handling for goal input when Wakatime + Coding Time is selected
    if (id === 'goal' && apiProvider === 'wakatime' && activityType === 'coding-time') {
      // Only allow integer values (no decimals)
      const integerValue = value.replace(/[^\d]/g, ''); // Remove all non-digit characters
      setFormData({
        ...formData,
        [id]: integerValue,
      });
    } else {
      setFormData({
        ...formData,
        [id]: value,
      });
    }
  };

  useEffect(() => {
    if (error) {
      console.error("Transaction error:", error);
      toast.error("Transaction failed: " + error.message);
      setIsSubmitting(false);
    }
  }, [error]);

  useEffect(() => {
    if (isConfirmed && receipt) {
      // Parse the ChallengeCreated event from the transaction logs
      // The event signature is: ChallengeCreated(uint256 indexed challengeId, address indexed creator, ...)
      const challengeCreatedTopic = '0x...' // This would be the event signature hash

      // For now, we'll extract the challenge ID from the logs
      // The first topic after the event signature is the challengeId (since it's indexed)
      let createdChallengeId: number | null = null;

      if (receipt.logs && receipt.logs.length > 0) {
        // Find the log that contains ChallengeCreated event
        // The challengeId should be in the first indexed parameter (topic[1])
        for (const log of receipt.logs) {
          if (log.topics && log.topics.length >= 2) {
            // The challenge ID is in topics[1] (first indexed parameter)
            const challengeIdHex = log.topics[1];
            if (challengeIdHex) {
              createdChallengeId = Number(BigInt(challengeIdHex));
              break;
            }
          }
        }
      }

      toast.success("Challenge created successfully!");
      setIsSubmitting(false);

      // Navigate to the newly created challenge
      if (createdChallengeId !== null) {
        navigate(`/challenge/${createdChallengeId}`);
      } else {
        // Fallback: just go to discover page if we can't parse the ID
        console.warn("Could not parse challenge ID from receipt");
        navigate('/discover');
      }
    }
  }, [isConfirmed, receipt, navigate]);

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

    if (!apiProvider) {
      toast.error("Please select an API provider");
      return;
    }

    if (!activityType) {
      toast.error("Please select an activity type");
      return;
    }

    // Validate Wakatime API key exists if Wakatime is selected (check backend)
    if (apiProvider === 'wakatime') {
      try {
        const res = await wakatimeService.checkApiKey(wallet.address);
        if (!res.has_api_key) {
          toast.error("Wakatime challenges require an API key. Please add your Wakatime API key in your Profile page before creating a challenge.");
          return;
        }
      } catch (err) {
        console.error('Failed to verify Wakatime API key:', err);
        toast.error("Could not verify your Wakatime API key. Please try again.");
        return;
      }
    }

    // Validate goal is a positive integer for Wakatime coding time
    if (apiProvider === 'wakatime' && activityType === 'coding-time') {
      const goalValue = parseInt(formData.goal);
      if (isNaN(goalValue) || goalValue <= 0) {
        toast.error("Please enter a valid positive number for coding hours goal");
        return;
      }
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
      let recipientAddress = formData.contractAddress;
      if (beneficiary !== "friend") {
        recipientAddress = charityWallets[beneficiary] || recipientAddress;
      }

      if (!recipientAddress || recipientAddress === "") {
        toast.error("Please provide a valid beneficiary address");
        setIsSubmitting(false);
        return;
      }

      // Parse whitelisted addresses for private challenges
      let whitelistedParticipants: `0x${string}`[] = [];
      if (isPrivate) {
        if (!whitelistedAddresses.trim()) {
          toast.error("Please provide at least one address for private challenges");
          setIsSubmitting(false);
          return;
        }

        const addresses = whitelistedAddresses
          .split(',')
          .map(addr => addr.trim())
          .filter(addr => addr.length > 0);

        // Validate addresses
        const invalidAddresses = addresses.filter(addr => !addr.match(/^0x[a-fA-F0-9]{40}$/));
        if (invalidAddresses.length > 0) {
          toast.error("Invalid Ethereum address format detected");
          setIsSubmitting(false);
          return;
        }

        whitelistedParticipants = addresses as `0x${string}`[];
      }

      const startTimeTimestamp = Math.floor(startDateTime.getTime() / 1000);
      const endTimeTimestamp = Math.floor(endDateTime.getTime() / 1000);
      const goalAmount = BigInt(formData.goal);

      // Map the frontend activity type to the contract-expected format
      const contractActivityType = mapActivityTypeToContract(activityType);

      toast.info("Please confirm the transaction in your wallet...");

      writeContract({
        address: CONTRACT_ADDRESS,
        abi: MOTIFY_ABI,
        functionName: "createChallenge",
        args: [
          recipientAddress as `0x${string}`,
          BigInt(startTimeTimestamp),
          BigInt(endTimeTimestamp),
          isPrivate,
          formData.name,
          apiProvider,
          contractActivityType, // Use mapped activity type
          goalAmount,
          formData.description,
          whitelistedParticipants,
        ],
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

  const duration = calculateDuration();

  // Charity wallet addresses mapping
  const charityWallets: Record<string, string> = {
    charity1: "0x1111111111111111111111111111111111111111",
    charity2: "0x2222222222222222222222222222222222222222",
    charity3: "0x3333333333333333333333333333333333333333",
  };

  // Get available activity types based on selected API provider
  const getActivityTypes = () => {
    if (apiProvider === "github") {
      // Only allow GitHub public contributions per day
      return [
        { value: "contribution_per_day", label: "Public Contributions per Day", icon: "⚙️" },
      ];
    } else if (apiProvider === "farcaster") {
      // Only allow Farcaster casts per day
      return [
        { value: "cast_per_day", label: "Casts per day", icon: "📢" },
      ];
    } else if (apiProvider === "wakatime") {
      return [
        { value: "coding-time", label: "Coding Time (hours)", icon: "⏱️" },
      ];
    }
    return [];
  };

  // Map frontend activity type values to backend/contract expected values
  const mapActivityTypeToContract = (type: string): string => {
    const mapping: Record<string, string> = {
      // New provider-specific goal types
      'contribution_per_day': 'contribution_per_day',
      'cast_per_day': 'cast_per_day',
      'commits': 'COMMITS',
      'pull-requests': 'PULL_REQUESTS',
      'issues': 'ISSUES_FIXED',
      'casts': 'CASTS',
      'coding-time': 'CODING_TIME',
    };
    return mapping[type] || type.toUpperCase();
  };

  // Get the display unit for the goal input based on activity type
  const getGoalUnit = () => {
    if (apiProvider === 'wakatime' && activityType === 'coding-time') {
      return 'hours';
    } else if (apiProvider === 'github') {
      if (activityType === 'contribution_per_day') return 'contributions';
      if (activityType === 'commits') return 'commits';
      if (activityType === 'pull-requests') return 'PRs';
      if (activityType === 'issues') return 'issues';
    } else if (apiProvider === 'farcaster') {
      if (activityType === 'cast_per_day' || activityType === 'casts') return 'casts';
    }
    return '';
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
          <Link to="/home">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold flex-1">Create Challenge</h1>
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
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what participants need to achieve..."
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
                    <SelectItem value="github">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-800 dark:bg-gray-200 flex items-center justify-center">
                          <Github className="w-3 h-3 text-white dark:text-gray-800" />
                        </div>
                        <span>GitHub</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="farcaster">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center overflow-hidden">
                          <img src="/farcaster-icon.svg" alt="Farcaster" className="w-3 h-3" />
                        </div>
                        <span>Farcaster</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="wakatime">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden">
                          <img src="/wakatime-icon.svg" alt="Wakatime" className="w-full h-full object-cover" />
                        </div>
                        <span>Wakatime</span>
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
                <Label htmlFor="goal">
                  Goal {getGoalUnit() && `(${getGoalUnit()})`}
                </Label>
                <Input
                  id="goal"
                  type={apiProvider === 'wakatime' && activityType === 'coding-time' ? 'text' : 'number'}
                  inputMode={apiProvider === 'wakatime' && activityType === 'coding-time' ? 'numeric' : 'decimal'}
                  placeholder={
                    apiProvider === 'wakatime' && activityType === 'coding-time' 
                      ? 'e.g., 24' 
                      : 'e.g., 10000'
                  }
                  required
                  className="bg-background"
                  value={formData.goal}
                  onChange={handleInputChange}
                />
                <p className="text-xs text-muted-foreground">
                  {apiProvider === 'wakatime' && activityType === 'coding-time'
                    ? 'Enter total coding hours to achieve (integers only)'
                    : 'The target value participants must achieve'}
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
                <Heart className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-lg">Beneficiary</h3>
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

          {/* Private Challenge Settings */}
          <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border/50 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}></div>
            </div>

            <div className="relative space-y-5">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold text-lg">Challenge Access</h3>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isPrivate">Private Challenge</Label>
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isPrivate ? "Only whitelisted addresses can join" : "Anyone can join this challenge"}
                </p>
              </div>

              {isPrivate && (
                <div className="space-y-2 p-4 bg-background/50 rounded-lg border border-border/50">
                  <Label htmlFor="whitelistedAddresses">Whitelisted Addresses</Label>
                  <Textarea
                    id="whitelistedAddresses"
                    placeholder="0x123..., 0x456..., 0x789..."
                    className="bg-background min-h-[80px] resize-none font-mono text-sm"
                    value={whitelistedAddresses}
                    onChange={(e) => setWhitelistedAddresses(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter Ethereum addresses separated by commas
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Summary Card */}
          {formData.name && formData.goal && duration && (
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
                    <span className="font-medium">{formData.goal} {getGoalUnit() || 'units'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{isPrivate ? 'Private' : 'Public'}</span>
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