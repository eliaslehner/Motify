import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const CreateChallenge = () => {
  const navigate = useNavigate();
  const { wallet } = useAuth();
  const [beneficiary, setBeneficiary] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    wager: "",
    goal: "",
    contractAddress: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
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
    const now = new Date();

    if (startDate < now) {
      toast.error("Start date must be in the future");
      return;
    }

    if (endDate <= startDate) {
      toast.error("End date must be after start date");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare contract address based on beneficiary selection
      let contractAddress = formData.contractAddress;
      if (beneficiary !== "friend") {
        // Use predefined charity addresses
        const charityAddresses: Record<string, string> = {
          charity1: "0x1111111111111111111111111111111111111111", // Red Cross
          charity2: "0x2222222222222222222222222222222222222222", // UNICEF
          charity3: "0x3333333333333333333333333333333333333333", // WWF
        };
        contractAddress = charityAddresses[beneficiary] || contractAddress;
      }

      // Create challenge via API (no blockchain transaction yet)
      const challenge = await apiService.createChallenge({
        name: formData.name,
        description: formData.description,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        contract_address: contractAddress,
        goal: formData.goal,
      });

      // Automatically join the challenge with the wager amount
      const wagerAmount = parseFloat(formData.wager);
      if (wagerAmount >= 1 && wallet.address) {
        await apiService.joinChallenge(challenge.id, wallet.address, wagerAmount);
        toast.success(`Challenge created and joined with $${wagerAmount}!`);
      } else {
        toast.success("Challenge created successfully!");
      }

      navigate("/");
    } catch (error) {
      console.error("Error creating challenge:", error);
      toast.error("Failed to create challenge. Please try again.");
    } finally {
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
                placeholder="e.g., Run 50km"
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
                  className="bg-background w-full"
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
                  className="bg-background w-full"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Wager Amount */}
            <div className="space-y-2">
              <Label htmlFor="wager">Your Wager Amount (USD)</Label>
              <Input
                id="wager"
                type="number"
                placeholder="100"
                min="1"
                step="0.01"
                required
                className="bg-background"
                value={formData.wager}
                onChange={handleInputChange}
              />
              <p className="text-xs text-muted-foreground">
                Minimum $1 USD. Amount tracked off-chain (blockchain integration coming soon).
              </p>
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

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90"
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Challenge"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default CreateChallenge;
