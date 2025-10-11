import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const WebLogin = () => {
  const { connectWallet, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-8 max-w-md w-full bg-gradient-card border-border text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to Motify</h1>
          <p className="text-muted-foreground">
            Connect your wallet to start creating and joining challenges
          </p>
        </div>
        
        <Button
          onClick={connectWallet}
          disabled={isLoading}
          size="lg"
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </Button>
        
        <p className="text-xs text-muted-foreground mt-4">
          We support Coinbase Wallet with Smart Wallet for a seamless experience
        </p>
      </Card>
    </div>
  );
};
