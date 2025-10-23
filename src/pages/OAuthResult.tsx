// pages/OAuthResult.tsx
// Handles OAuth callback results from backend

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function OAuthResult() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Read OAuth result from localStorage (set by the callback HTML page)
    const resultJson = localStorage.getItem('oauth_result');
    
    if (resultJson) {
      try {
        const result = JSON.parse(resultJson);
        
        // Clear the stored result
        localStorage.removeItem('oauth_result');
        
        // Check if result is recent (within last 30 seconds)
        const resultAge = Date.now() - result.timestamp;
        if (resultAge > 30000) {
          toast.error("OAuth session expired. Please try again.");
          navigate("/profile");
          return;
        }
        
        if (result.success) {
          toast.success(`Successfully connected ${result.provider}!`);
          navigate("/profile");
        } else {
          const errorMessage = result.error === "invalid_state"
            ? "Invalid OAuth state. Please try again."
            : result.error === "expired_state"
            ? "OAuth session expired. Please try again."
            : result.error === "token_exchange_failed"
            ? "Failed to exchange token. Please try again."
            : "OAuth authentication failed.";
          
          toast.error(errorMessage);
          navigate("/profile");
        }
      } catch (e) {
        console.error("Failed to parse OAuth result:", e);
        toast.error("OAuth authentication failed.");
        navigate("/profile");
      }
    } else {
      // No result in localStorage, redirect to profile
      // toast.error("No OAuth result found.");
      navigate("/profile");
    }
    
    setIsProcessing(false);
  }, [navigate]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Processing OAuth result...</p>
        </div>
      </div>
    );
  }

  return null;
}
