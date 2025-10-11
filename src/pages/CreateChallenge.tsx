import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";

const CreateChallenge = () => {
  const navigate = useNavigate();
  const [beneficiary, setBeneficiary] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Challenge created successfully!");
    navigate("/");
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
              />
            </div>

            {/* Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Date</Label>
                <Input
                  id="start"
                  type="date"
                  required
                  className="bg-background w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Date</Label>
                <Input
                  id="end"
                  type="date"
                  required
                  className="bg-background w-full"
                />
              </div>
            </div>

            {/* Wager Amount */}
            <div className="space-y-2">
              <Label htmlFor="wager">Wager Amount (USDC)</Label>
              <Input
                id="wager"
                type="number"
                placeholder="100"
                min="1"
                required
                className="bg-background"
              />
            </div>

            {/* Activity Template */}
            <div className="space-y-2">
              <Label htmlFor="activity">Activity Template</Label>
              <Select required>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strava">Strava Running</SelectItem>
                  <SelectItem value="github">GitHub Commits</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Goal */}
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Input
                id="goal"
                placeholder="e.g., 50 km total distance"
                required
                className="bg-background"
              />
            </div>

            {/* Beneficiary */}
            <div className="space-y-2">
              <Label htmlFor="beneficiary">Beneficiary (if you fail)</Label>
              <Select required onValueChange={setBeneficiary}>
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
                <Label htmlFor="wallet">Friend's Wallet Address</Label>
                <Input
                  id="wallet"
                  placeholder="0x..."
                  required
                  className="bg-background"
                />
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90"
              size="lg"
            >
              Create Challenge
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default CreateChallenge;
