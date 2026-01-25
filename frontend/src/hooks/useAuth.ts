import { useState, useEffect, useCallback } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { WalletState } from '../types/vault';
import { ACTIVE_NETWORK } from '../config/contracts';

/**
 * Custom hook for wallet authentication
 * Handles wallet connection, disconnection, and user state
 */
export const useAuth = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: BigInt(0),
    balanceSTX: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize app config and user session
  const appConfig = new AppConfig(['store_write', 'publish_data']);
  const userSession = new UserSession({ appConfig });

  // Get the appropriate network
  const network = ACTIVE_NETWORK === 'testnet' 
    ? new StacksTestnet() 
    : new StacksMainnet();

  /**
   * Fetch STX balance for a given address
   */
  const fetchBalance = useCallback(async (address: string): Promise<bigint> => {
    try {
      const apiUrl = ACTIVE_NETWORK === 'testnet'
        ? 'https://api.testnet.hiro.so'
        : 'https://api.mainnet.hiro.so';

      const response = await fetch(`${apiUrl}/v2/accounts/${address}`);
      const data = await response.json();
      
      const balance = BigInt(data.balance || '0');
      return balance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return BigInt(0);
    }
  }, []);

  /**
   * Update wallet state with current user data
   */
  const updateWalletState = useCallback(async () => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      const address = userData.profile.stxAddress[ACTIVE_NETWORK];
      const balance = await fetchBalance(address);
      const balanceSTX = Number(balance) / 1_000_000;

      setWalletState({
        isConnected: true,
        address,
        balance,
        balanceSTX,
      });
    } else {
      setWalletState({
        isConnected: false,
        address: null,
        balance: BigInt(0),
        balanceSTX: 0,
      });
    }
    setIsLoading(false);
  }, [userSession, fetchBalance]);

  /**
   * Connect wallet using Stacks Connect
   */
  const connectWallet = useCallback(() => {
    showConnect({
      appDetails: {
        name: 'BitFlow Finance',
        icon: window.location.origin + '/logo.png',
      },
      redirectTo: '/',
      onFinish: () => {
        updateWalletState();
      },
      userSession,
    });
  }, [userSession, updateWalletState]);

  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    userSession.signUserOut();
    setWalletState({
      isConnected: false,
      address: null,
      balance: BigInt(0),
      balanceSTX: 0,
    });
  }, [userSession]);

  /**
   * Refresh balance
   */
  const refreshBalance = useCallback(async () => {
    if (walletState.address) {
      const balance = await fetchBalance(walletState.address);
      const balanceSTX = Number(balance) / 1_000_000;
      
      setWalletState(prev => ({
        ...prev,
        balance,
        balanceSTX,
      }));
    }
  }, [walletState.address, fetchBalance]);

  // Check if user is already signed in on mount
  useEffect(() => {
    updateWalletState();
  }, [updateWalletState]);

  // Auto-refresh balance every 30 seconds if connected
  useEffect(() => {
    if (walletState.isConnected && walletState.address) {
      const interval = setInterval(() => {
        refreshBalance();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [walletState.isConnected, walletState.address, refreshBalance]);

  return {
    // State
    ...walletState,
    isLoading,
    userSession,

    // Actions
    connectWallet,
    disconnectWallet,
    refreshBalance,

    // Helpers
    network,
  };
};

export default useAuth;
