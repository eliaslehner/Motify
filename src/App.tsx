// App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { sdk } from "@farcaster/miniapp-sdk";
import { useEffect } from "react";
import { OnchainProviders } from "@/providers/OnchainProviders";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import BottomNavigationBar from "@/components/BottomNavigationBar";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import CreateChallenge from "./pages/CreateChallenge";
import ChallengeDetail from "./pages/ChallengeDetail";
import OAuthResult from "./pages/OAuthResult";
import NotFound from "./pages/NotFound";

const App = () => {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="motify-theme">
      <OnchainProviders>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/home" element={<Home />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/create" element={<CreateChallenge />} />
                <Route path="/challenge/:id" element={<ChallengeDetail />} />
                <Route path="/oauth/result" element={<OAuthResult />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNavigationBar />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </OnchainProviders>
    </ThemeProvider>
  );
};

export default App;
