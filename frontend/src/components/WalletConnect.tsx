import React, { useState } from 'react';
import { Wallet, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

/**
 * WalletConnect Component
 * Displays wallet connection button and user information
 */
export const WalletConnect: React.FC = () => {
  const { 
    isConnected, 
    address, 
    balanceSTX, 
    isLoading,
    connectWallet, 
    disconnectWallet,
    refreshBalance,
  } = useAuth();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('Manual balance refresh initiated');
      await refreshBalance();
      // Wait a bit longer to ensure balance updates
      await new Promise(resolve => setTimeout(resolve, 1500));
    } catch (error) {
      console.error('Error during manual refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format address for display
  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Format STX balance
  const formatBalance = (balance: number): string => {
    return balance.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
      >
        <Wallet size={20} />
        <span className="font-medium">Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Balance Display */}
      <div className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
        <div>
          <div className="text-xs text-gray-500">Balance</div>
          <div className="text-sm font-semibold text-gray-900">
            {formatBalance(balanceSTX)} STX
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Refresh Balance"
          disabled={isRefreshing}
        >
          <RefreshCw 
            size={16} 
            className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Address Display */}
      <div className="px-4 py-2 bg-primary-50 rounded-lg">
        <div className="text-xs text-primary-600">Connected</div>
        <div className="text-sm font-mono font-semibold text-primary-900">
          {address && formatAddress(address)}
        </div>
      </div>

      {/* Disconnect Button */}
      <button
        onClick={disconnectWallet}
        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        title="Disconnect Wallet"
      >
        <LogOut size={18} />
        <span className="text-sm font-medium">Disconnect</span>
      </button>
    </div>
  );
};

export default WalletConnect;
