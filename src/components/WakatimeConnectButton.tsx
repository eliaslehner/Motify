// components/WakatimeConnectButton.tsx
// Wakatime connection button component

import { CheckCircle2, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Input } from '@/components/ui/input';

interface WakatimeConnectButtonProps {
  onConnectionChange?: (connected: boolean) => void;
}

const WakatimeConnectButton = ({ onConnectionChange }: WakatimeConnectButtonProps) => {
  const { toast } = useToast();
  const { address } = useAccount();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (address) {
      loadApiKey();
    } else {
      setLoading(false);
    }
  }, [address]);

  const loadApiKey = async () => {
    if (!address) return;

    setLoading(true);
    try {
      // TODO: Implement actual Wakatime API key retrieval
      // const savedKey = await getWakatimeApiKey(address);
      // setApiKey(savedKey || '');
      setApiKey('');
    } catch (error) {
      console.error('Error loading Wakatime API key:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async (key: string) => {
    if (!address) return;

    setSaving(true);
    try {
      // TODO: Implement actual Wakatime API key saving
      // await saveWakatimeApiKey(address, key);
      
      onConnectionChange?.(key.length > 0);
      
      toast({
        title: 'API Key Saved',
        description: 'Your Wakatime API key has been saved successfully.',
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
    const newKey = e.target.value;
    setApiKey(newKey);
    
    // Auto-save after a brief delay to avoid too many saves
    const timeoutId = setTimeout(() => {
      if (newKey.trim()) {
        saveApiKey(newKey.trim());
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedKey = e.clipboardData.getData('text');
    if (pastedKey.trim()) {
      setApiKey(pastedKey.trim());
      // Save immediately on paste
      setTimeout(() => saveApiKey(pastedKey.trim()), 100);
    }
  };

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
    <div className="w-full rounded-lg p-3 border border-[hsl(220_20%_20%)] bg-[hsl(220_20%_18%)]">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-full shrink-0 bg-gray-800">
          <img src="/wakatime-icon.svg" alt="Wakatime" className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <span className="font-medium text-[hsl(220_15%_95%)]">Wakatime</span>
          <p className="text-xs text-[hsl(220_10%_65%)]">Paste your API key</p>
        </div>
        {apiKey && !saving && (
          <CheckCircle2 className="w-4 h-4 text-[hsl(142_76%_36%)] shrink-0" />
        )}
        {saving && (
          <span className="text-xs text-[hsl(220_10%_65%)]">Saving...</span>
        )}
      </div>
      <div className="relative">
        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(220_10%_65%)]" />
        <Input
          type="password"
          placeholder="waka_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          value={apiKey}
          onChange={handleApiKeyChange}
          onPaste={handlePaste}
          disabled={saving}
          className="pl-10 bg-[hsl(220_20%_15%)] border-[hsl(220_20%_25%)] text-[hsl(220_15%_95%)] placeholder:text-[hsl(220_10%_50%)] focus:border-[hsl(221_83%_53%)] disabled:opacity-50"
        />
      </div>
    </div>
  );
};

export default WakatimeConnectButton;
