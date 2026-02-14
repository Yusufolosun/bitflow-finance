import { useState, useEffect, useCallback, useRef } from 'react';
import {
  callReadOnlyFunction,
  ClarityType,
  cvToValue,
} from '@stacks/transactions';
import {
  getNetwork,
  getContractAddress,
  VAULT_CONTRACT,
} from '../config/contracts';

/**
 * Protocol stats returned from the contract's get-protocol-stats function
 */
export interface ProtocolStats {
  totalDeposits: number;
  totalBorrowed: number;
  totalRepaid: number;
  activeLoans: number;
  totalLiquidations: number;
}

/**
 * Custom hook that fetches real-time protocol statistics from the blockchain
 * Uses the get-protocol-stats read-only function on the vault contract
 *
 * @param refreshInterval - Auto-refresh interval in ms (default: 30000 = 30s, 0 = disabled)
 */
export const useProtocolStats = (refreshInterval = 30000) => {
  const [stats, setStats] = useState<ProtocolStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mountedRef = useRef(true);

  const network = getNetwork();
  const contractAddress = getContractAddress();
  const contractName = VAULT_CONTRACT.name;

  /**
   * Fetch protocol stats from the contract
   */
  const fetchStats = useCallback(async () => {
    try {
      setError(null);

      const result = await callReadOnlyFunction({
        network,
        contractAddress,
        contractName,
        functionName: 'get-protocol-stats',
        functionArgs: [],
        senderAddress: contractAddress,
      });

      if (!mountedRef.current) return;

      if (result.type === ClarityType.Tuple) {
        const data = cvToValue(result);

        const protocolStats: ProtocolStats = {
          totalDeposits: Number(data['total-deposits'] || 0) / 1_000_000,
          totalBorrowed: Number(data['total-borrowed'] || 0) / 1_000_000,
          totalRepaid: Number(data['total-repaid'] || 0) / 1_000_000,
          activeLoans: Number(data['active-loans'] || 0),
          totalLiquidations: Number(data['total-liquidations'] || 0),
        };

        setStats(protocolStats);
        setLastUpdated(new Date());
      } else {
        // Fallback: try to parse response envelope
        const data = cvToValue(result);
        if (data && typeof data === 'object') {
          const protocolStats: ProtocolStats = {
            totalDeposits: Number(data['total-deposits'] || 0) / 1_000_000,
            totalBorrowed: Number(data['total-borrowed'] || 0) / 1_000_000,
            totalRepaid: Number(data['total-repaid'] || 0) / 1_000_000,
            activeLoans: Number(data['active-loans'] || 0),
            totalLiquidations: Number(data['total-liquidations'] || 0),
          };
          setStats(protocolStats);
          setLastUpdated(new Date());
        }
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      console.error('Error fetching protocol stats:', err);
      setError(err.message || 'Failed to fetch protocol stats');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [network, contractAddress, contractName]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchStats();
  }, [fetchStats]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    fetchStats();

    return () => {
      mountedRef.current = false;
    };
  }, [fetchStats]);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const interval = setInterval(() => {
      fetchStats();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
};

export default useProtocolStats;
