// pages/CreateChallenge.tsx
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, MOTIFY_ABI } from "@/contract";

const CreateChallenge = () => {
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const [beneficiary, setBeneficiary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userTokenBalance, setUserTokenBalance] = useState(100); // Mock token balance
  const [stakeAmount, setStakeAmount] = useState("");
  const [tokensToUse, setTokensToUse] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    goal: "",
    contractAddress: "",
  });

  // Wagmi hooks for contract interaction
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

  // Handle transaction errors
  useEffect(() => {
    if (error) {
      console.error("Transaction error:", error);
      toast.error("Transaction failed: " + error.message);
      setIsSubmitting(false);
    }
  }, [error]);

  // Handle successful transaction confirmation
  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success("Challenge created on blockchain!");
      // Now save to backend
      saveToBackend();
    }
  }, [isConfirmed, hash]);

  const saveToBackend = async () => {
    try {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

      let contractAddress = formData.contractAddress;
      if (beneficiary !== "friend") {
        const charityAddresses: Record<string, string> = {
          charity1: "0x1111111111111111111111111111111111111111",
          charity2: "0x2222222222222222222222222222222222222222",
          charity3: "0x3333333333333333333333333333333333333333",
        };
        contractAddress = charityAddresses[beneficiary] || contractAddress;
      }

      const challenge = await apiService.createChallenge({
        name: formData.name,
        description: formData.description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        contract_address: contractAddress,
        goal: formData.goal,
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

    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine charity address
      let charityAddress = formData.contractAddress;
      if (beneficiary !== "friend") {
        const charityAddresses: Record<string, string> = {
          charity1: "0x1111111111111111111111111111111111111111",
          charity2: "0x2222222222222222222222222222222222222222",
          charity3: "0x3333333333333333333333333333333333333333",
        };
        charityAddress = charityAddresses[beneficiary] || charityAddress;
      }

      if (!charityAddress || charityAddress === "") {
        toast.error("Please provide a valid beneficiary address");
        setIsSubmitting(false);
        return;
      }

      // Convert end date to Unix timestamp (in seconds)
      const endTimeTimestamp = Math.floor(endDate.getTime() / 1000);

      // Call the smart contract
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">New Challenge</h1>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-6">
        <Card className="p-6 bg-gradient-card border-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Challenge Name */}
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

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your challenge..."
                required
                className="bg-background min-h-[100px]"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            {/* Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  className="bg-background w-full [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  required
                  className="bg-background w-full [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Goal */}
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Input
                id="goal"
                placeholder="e.g., 10000 (steps per day)"
                required
                className="bg-background"
                value={formData.goal}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground">
                The daily target value (e.g., steps, distance, commits)
              </p>
            </div>

            {/* Beneficiary */}
            <div className="space-y-2">
              <Label htmlFor="beneficiary">Beneficiary (if you fail)</Label>
              <Select required onValueChange={setBeneficiary} value={beneficiary}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select beneficiary" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="charity1">Red Cross</SelectItem>
                  <SelectItem value="charity2">UNICEF</SelectItem>
                  <SelectItem value="charity3">WWF</SelectItem>
                  <SelectItem value="friend">Send to Friend</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wallet Address (shown only when "Send to Friend" is selected) */}
            {beneficiary === "friend" && (
              <div className="space-y-2">
                <Label htmlFor="contractAddress">Friend's Wallet Address</Label>
                <Input
                  id="contractAddress"
                  placeholder="0x..."
                  required
                  className="bg-background"
                  value={formData.contractAddress}
                  onChange={handleInputChange}
                />
              </div>
            )}

            {/* Stake Amount */}
            <div className="space-y-2">
              <Label htmlFor="stake">Stake Amount (USDC)</Label>
              <Input
                id="stake"
                type="number"
                placeholder="100"
                step="0.01"
                min="0"
                className="bg-background"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This is the amount each participant will stake when joining
              </p>
            </div>

            {/* Token Section */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-purple-500/0 border border-purple-500/20">
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Reduce Fee with Tokens</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Your Tokens</Label>
                    <p className="text-lg font-semibold mt-1">{userTokenBalance}</p>
                    <p className="text-xs text-muted-foreground">MOTIFY</p>
                  </div>
                  <div>
                    <Label htmlFor="tokensToUse" className="text-xs text-muted-foreground">Use Tokens</Label>
                    <Input
                      id="tokensToUse"
                      type="number"
                      placeholder="0"
                      step="1"
                      min="0"
                      max={userTokenBalance}
                      className="bg-background mt-1"
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

                {/* Token Calculation */}
                {(stakeAmount || tokensToUse) && (
                  <div className="p-3 rounded bg-background/50 space-y-1 border border-purple-500/10">
                    <p className="text-xs text-muted-foreground">
                      Original: <span className="font-semibold text-foreground">{stakeAmount || '0'} USDC</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tokens Used: <span className="font-semibold text-purple-600">-{tokensToUse || '0'} MOTIFY</span>
                    </p>
                    <div className="h-px bg-border/30 my-1"></div>
                    <p className="text-xs font-medium">
                      Final Amount: <span className="text-lg font-semibold text-primary">
                        {Math.max(0, (parseFloat(stakeAmount) || 0) - (parseFloat(tokensToUse) || 0) * 0.1).toFixed(2)} USDC
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      (1 token = 0.1 USDC reduction)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90"
              size="lg"
              disabled={isSubmitting || isPending || isConfirming}
            >
              {isPending
                ? "Confirm in Wallet..."
                : isConfirming
                  ? "Confirming Transaction..."
                  : isSubmitting
                    ? "Saving..."
                    : "Create Challenge"}
            </Button>

            {hash && (
              <p className="text-xs text-center text-muted-foreground">
                Transaction: {hash.slice(0, 10)}...{hash.slice(-8)}
              </p>
            )}
          </form>
        </Card>
      </main>
    </div>
  );
};

export default CreateChallenge;
