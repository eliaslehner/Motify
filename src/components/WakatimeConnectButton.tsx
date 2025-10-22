// components/WakatimeConnectButton.tsx
// Wakatime connection button component with backend integration

import { CheckCircle2, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { wakatimeService } from '@/services/api';

interface WakatimeConnectButtonProps {
  onConnectionChange?: (connected: boolean) => void;
}

const WakatimeConnectButton = ({ onConnectionChange }: WakatimeConnectButtonProps) => {
  const { toast } = useToast();
  const { address } = useAccount();
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (address) {
      checkApiKey();
    }
  }, [address]);

  const checkApiKey = async () => {
    if (!address) return;

    setLoading(true);
    try {
      const result = await wakatimeService.checkApiKey(address);
      setHasApiKey(result.has_api_key);
      
      console.log('[WakaTime] Connection status checked:', {
        wallet: address,
        hasApiKey: result.has_api_key,
      });
    } catch (error) {
      console.error('Error checking Wakatime API key:', error);
      setHasApiKey(false);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!address) return;

    const trimmedKey = apiKey.trim();
    
    // Validate API key format
    if (!trimmedKey.startsWith('waka_')) {
      toast({
        title: 'Invalid API Key',
        description: 'WakaTime API key must start with "waka_"',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    setShowSuccess(false);
    try {
      console.log('[WakaTime] Saving API key to backend...');

      await wakatimeService.saveApiKey(address, trimmedKey);
      
      setHasApiKey(true);
      setApiKey(''); // Clear input after successful save
      setShowSuccess(true);
      
      console.log('[WakaTime] API key saved successfully');
      
      // Hide success indicator after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
      
      onConnectionChange?.(true);
      
      toast({
        title: 'Success',
        description: 'WakaTime API key saved successfully',
      });
    } catch (error) {
      console.error('Error saving Wakatime API key:', error);
      toast({
        title: 'Save Error',
        description: error instanceof Error ? error.message : 'Failed to save API key',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    setShowSuccess(false);
  };

  const hasValue = apiKey.trim().length > 0;

  if (!address) {
    return (
      <div className="w-full rounded-lg p-3 border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_18%)] opacity-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-gray-800">
            <img src="/wakatime-icon.svg" alt="Wakatime" className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium text-[hsl(220_15%_95%)]">Wakatime</span>
            <p className="text-xs text-[hsl(220_10%_65%)]">Connect wallet first</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full rounded-lg p-3 border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_18%)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-gray-800">
            <img src="/wakatime-icon.svg" alt="Wakatime" className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium text-[hsl(220_15%_95%)]">Wakatime</span>
            <p className="text-xs text-[hsl(220_10%_65%)]">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg p-3 border border-[hsl(220_20%_20%)] bg-white">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 overflow-hidden">
          <img src="/wakatime-icon.svg" alt="Wakatime" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 text-left">
          <span className="font-medium text-black">Wakatime</span>
          <p className="text-xs text-black">
            {hasApiKey ? 'Connected - Update key' : 'Enter your API key'}
          </p>
        </div>
        {showSuccess && (
          <div className="flex items-center gap-1 text-[hsl(142_76%_36%)]">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">Saved</span>
          </div>
        )}
        {!showSuccess && hasApiKey && !hasValue && (
          <CheckCircle2 className="w-4 h-4 text-[hsl(142_76%_36%)] shrink-0" />
        )}
      </div>
      <div className="relative mb-2">
        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black" />
        <Input
          type="password"
          placeholder="waka_xxxxxxxx..."
          value={apiKey}
          onChange={handleApiKeyChange}
          disabled={saving}
          className="pl-10 bg-white border-[hsl(220_20%_25%)] text-black placeholder:text-[hsl(220_10%_50%)] disabled:opacity-50"
        />
      </div>
      {hasValue && (
        <Button
          onClick={saveApiKey}
          disabled={saving}
          className="w-full bg-[hsl(221_83%_53%)] hover:bg-[hsl(221_83%_48%)] text-white"
          size="sm"
        >
          {saving ? 'Saving...' : 'Save API Key'}
        </Button>
      )}
    </div>
  );
};

export default WakatimeConnectButton;
