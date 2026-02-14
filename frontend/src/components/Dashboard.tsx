import React, { useState } from 'react';
import { TrendingUp, DollarSign, Activity, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useVault } from '../hooks/useVault';
import { StatsCard } from './StatsCard';
import { WalletConnect } from './WalletConnect';
import { DepositCard } from './DepositCard';
import { BorrowCard } from './BorrowCard';
import { RepayCard } from './RepayCard';
import { HealthMonitor } from './HealthMonitor';
import { TransactionHistory } from './TransactionHistory';
import { NetworkIndicator } from './NetworkIndicator';
import { formatSTX } from '../utils/formatters';
import { ACTIVE_NETWORK } from '../config/contracts';
import { useProtocolStats } from '../hooks/useProtocolStats';
import { LoadingStats } from './LoadingCard';
import { ErrorState } from './ErrorState';

/**
 * Dashboard Component
 * Main dashboard layout with protocol stats and user portfolio
 */
export const Dashboard: React.FC = () => {
  const { address, balanceSTX, userSession } = useAuth();
  const vault = useVault(userSession, address);
  const { stats: protocolStats, isLoading: statsLoading, error: statsError, lastUpdated: statsLastUpdated, refresh: refreshStats } = useProtocolStats(30000);

  // Protocol stats derived from hook
  const totalValueLocked = protocolStats?.totalDeposits ?? 0;
  const totalBorrowed = protocolStats?.totalBorrowed ?? 0;
  const totalRepaid = protocolStats?.totalRepaid ?? 0;
  const activeUsers = protocolStats?.activeLoans ?? 0;

  // User portfolio
  const [userDeposit, setUserDeposit] = useState(0);
  const [userLoan, setUserLoan] = useState<any>(null);
  const [userHealthFactor, setUserHealthFactor] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Protocol stats now fetched via useProtocolStats hook (auto-refreshes every 30s)

  // Fetch user portfolio data - DISABLED to prevent rate limiting
  // Data will be fetched after user actions (deposits, borrows, etc.)
  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     if (address) {
  //       console.log('Fetching user data for address:', address);
  //       
  //       const deposit = await vault.getUserDeposit();
  //       if (deposit) {
  //         console.log('User deposit:', deposit);
  //         setUserDeposit(deposit.amountSTX);
  //       }
  //
  //       const loan = await vault.getUserLoan();
  //       console.log('User loan result:', loan);
  //       setUserLoan(loan);
  //
  //       if (loan) {
  //         console.log('Fetching health factor for loan:', loan);
  //         const health = await vault.getHealthFactor(1.5);
  //         if (health) {
  //           console.log('Health factor:', health);
  //           setUserHealthFactor(health.healthFactorPercent);
  //         }
  //       } else {
  //         console.log('No active loan found');
  //         setUserHealthFactor(null);
  //       }
  //     }
  //   };
  //
  //   fetchUserData();
  //   // Auto-refresh disabled to prevent rate limiting
    // const interval = setInterval(fetchUserData, 60000);
    // return () => clearInterval(interval);
  // }, [address, vault]);

  // Manual refresh function for user portfolio
  const refreshUserData = async () => {
    if (!address) {
      setRefreshError('Please connect your wallet first');
      return;
    }

    setIsRefreshing(true);
    setRefreshError(null);
    console.log('Manually refreshing user data for address:', address);
    
    try {
      const deposit = await vault.getUserDeposit();
      if (deposit) {
        console.log('User deposit:', deposit);
        setUserDeposit(deposit.amountSTX);
      } else {
        setUserDeposit(0);
      }

      const loan = await vault.getUserLoan();
      console.log('User loan result:', loan);
      setUserLoan(loan);

      if (loan) {
        console.log('Fetching health factor for loan:', loan);
        const health = await vault.getHealthFactor(1.5);
        if (health) {
          console.log('Health factor:', health);
          setUserHealthFactor(health.healthFactorPercent);
        }
      } else {
        console.log('No active loan found');
        setUserHealthFactor(null);
      }
      
      console.log('Refresh completed successfully');
    } catch (error: any) {
      console.error('Error refreshing data:', error);
      setRefreshError(error.message || 'Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Calculate utilization rate
  const utilizationRate = totalValueLocked > 0 
    ? (totalBorrowed / totalValueLocked) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">BitFlow Finance</h1>
                <p className="text-sm text-gray-500">Decentralized Lending Protocol</p>
              </div>
              <NetworkIndicator />
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Protocol Stats */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Protocol Overview</h2>
              {statsLastUpdated && (
                <p className="text-xs text-gray-400">
                  Updated {statsLastUpdated.toLocaleTimeString()} · auto-refreshes every 30s
                </p>
              )}
            </div>
            <button
              onClick={refreshStats}
              disabled={statsLoading}
              className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {statsLoading ? 'Loading...' : 'Refresh Stats'}
            </button>
          </div>

          {/* Loading State */}
          {statsLoading && !protocolStats && <LoadingStats />}

          {/* Error State */}
          {statsError && !protocolStats && (
            <ErrorState
              title="Failed to Load Protocol Stats"
              message={statsError}
              onRetry={refreshStats}
            />
          )}

          {/* Stats Grid */}
          {protocolStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              icon={<DollarSign size={24} />}
              label="Total Value Locked"
              value={formatSTX(totalValueLocked) + ' STX'}
              color="blue"
            />
            <StatsCard
              icon={<TrendingUp size={24} />}
              label="Total Borrowed"
              value={formatSTX(totalBorrowed) + ' STX'}
              color="green"
            />
            <StatsCard
              icon={<Activity size={24} />}
              label="Utilization Rate"
              value={utilizationRate.toFixed(1) + '%'}
              color="purple"
            />
            <StatsCard
              icon={<Users size={24} />}
              label="Active Loans"
              value={activeUsers.toString()}
              color="orange"
            />
          </div>
          )}
        </section>

        {/* User Portfolio */}
        {address && (
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Portfolio</h2>
              <button
                onClick={refreshUserData}
                disabled={isRefreshing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <svg 
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
            
            {/* Error Message */}
            {refreshError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">{refreshError}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-gray-500 mb-2">Total Deposited</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {formatSTX(userDeposit)} STX
                </div>
                <div className="text-sm text-gray-600">
                  ≈ ${(userDeposit * 1.5).toLocaleString()} USD
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-gray-500 mb-2">Active Loan</div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {userLoan ? formatSTX(userLoan.amountSTX) : '0.00'} STX
                </div>
                <div className="text-sm text-gray-600">
                  {userLoan 
                    ? `${userLoan.interestRatePercent}% APR` 
                    : 'No active loan'}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-sm text-gray-500 mb-2">Health Factor</div>
                <div className={`text-3xl font-bold mb-1 ${
                  !userLoan ? 'text-gray-400' :
                  userHealthFactor && userHealthFactor >= 150 ? 'text-green-600' :
                  userHealthFactor && userHealthFactor >= 110 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {userHealthFactor ? userHealthFactor.toFixed(0) + '%' : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">
                  {!userLoan ? 'No active loan' :
                   userHealthFactor && userHealthFactor >= 150 ? 'Healthy' :
                   userHealthFactor && userHealthFactor >= 110 ? 'At Risk' : 'Critical'}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Action Cards */}
        {!address ? (
          <section className="mb-8">
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Activity className="mx-auto text-gray-400 mb-4" size={64} />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to BitFlow Finance
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Connect your wallet to start depositing, borrowing, and earning with your STX tokens.
              </p>
              <WalletConnect />
            </div>
          </section>
        ) : (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <DepositCard />
                <BorrowCard />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <RepayCard />
                <HealthMonitor />
              </div>
            </div>
          </section>
        )}

        {/* Transaction History */}
        {address && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Transaction History</h2>
            <TransactionHistory />
          </section>
        )}

        {/* Quick Stats Footer */}
        <section>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm opacity-90 mb-1">Your Wallet Balance</div>
                <div className="text-2xl font-bold">
                  {address ? formatSTX(balanceSTX) : '0.00'} STX
                </div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Total Repaid (Protocol)</div>
                <div className="text-2xl font-bold">
                  {formatSTX(totalRepaid)} STX
                </div>
              </div>
              <div>
                <div className="text-sm opacity-90 mb-1">Network</div>
                <div className="text-2xl font-bold">
                  Stacks {ACTIVE_NETWORK === 'mainnet' ? 'Mainnet' : 'Testnet'}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-500">
              © 2026 BitFlow Finance. Built on Stacks.
            </div>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Docs</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">GitHub</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Discord</a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
