import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect } from "react";
import { OnchainProviders } from "@/providers/OnchainProviders";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import CreateChallenge from "./pages/CreateChallenge";
import ChallengeDetail from "./pages/ChallengeDetail";
import NotFound from "./pages/NotFound";

const App = () => {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <OnchainProviders>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/create" element={<CreateChallenge />} />
              <Route path="/challenge/:id" element={<ChallengeDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </OnchainProviders>
  );
};

export default App;
