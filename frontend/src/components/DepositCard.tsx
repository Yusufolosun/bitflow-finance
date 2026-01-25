import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useVault } from '../hooks/useVault';
import { formatSTX } from '../types/vault';

/**
 * DepositCard Component
 * Allows users to deposit STX into the vault
 */
export const DepositCard: React.FC = () => {
  const { address, balanceSTX, userSession } = useAuth();
  const vault = useVault(userSession, address);

  const [depositAmount, setDepositAmount] = useState('');
  const [userDeposit, setUserDeposit] = useState(0);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch user's current deposit
  useEffect(() => {
    const fetchDeposit = async () => {
      if (address) {
        const deposit = await vault.getUserDeposit();
        if (deposit) {
          setUserDeposit(deposit.amountSTX);
        }
      }
    };

    fetchDeposit();
    // Refresh every 10 seconds
    const interval = setInterval(fetchDeposit, 10000);
    return () => clearInterval(interval);
  }, [address, vault]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);

    // Validation
    if (!amount || amount <= 0) {
      setErrorMessage('Please enter a valid amount');
      setTxStatus('error');
      return;
    }

    if (amount > balanceSTX) {
      setErrorMessage('Insufficient balance');
      setTxStatus('error');
      return;
    }

    setTxStatus('pending');
    setErrorMessage('');

    try {
      const result = await vault.deposit(amount);

      if (result.success) {
        setTxStatus('success');
        setDepositAmount('');
        // Refresh deposit after 5 seconds
        setTimeout(async () => {
          const deposit = await vault.getUserDeposit();
          if (deposit) {
            setUserDeposit(deposit.amountSTX);
          }
          setTxStatus('idle');
        }, 5000);
      } else {
        setTxStatus('error');
        setErrorMessage(result.error || 'Transaction failed');
      }
    } catch (error: any) {
      setTxStatus('error');
      setErrorMessage(error.message || 'An error occurred');
    }
  };

  const handleMaxClick = () => {
    // Reserve 0.1 STX for fees
    const maxAmount = Math.max(0, balanceSTX - 0.1);
    setDepositAmount(maxAmount.toString());
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary-100 rounded-lg">
          <ArrowDownCircle className="text-primary-600" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Deposit STX</h3>
          <p className="text-sm text-gray-500">Deposit to earn and borrow</p>
        </div>
      </div>

      {/* Current Deposit Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-xs text-gray-500 mb-1">Your Total Deposit</div>
        <div className="text-2xl font-bold text-gray-900">
          {formatSTX(userDeposit)} STX
        </div>
      </div>

      {/* Deposit Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Deposit Amount
        </label>
        <div className="relative">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={txStatus === 'pending'}
          />
          <button
            onClick={handleMaxClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-primary-100 text-primary-600 rounded text-sm font-medium hover:bg-primary-200 transition-colors"
            disabled={txStatus === 'pending'}
          >
            MAX
          </button>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Available: {formatSTX(balanceSTX)} STX</span>
          {depositAmount && (
            <span>
              New Total: {formatSTX(userDeposit + parseFloat(depositAmount || '0'))} STX
            </span>
          )}
        </div>
      </div>

      {/* Deposit Button */}
      <button
        onClick={handleDeposit}
        disabled={!address || txStatus === 'pending' || !depositAmount}
        className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {txStatus === 'pending' && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        )}
        {txStatus === 'pending' ? 'Depositing...' : 'Deposit STX'}
      </button>

      {/* Status Messages */}
      {txStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <CheckCircle className="text-green-600" size={20} />
          <span className="text-sm text-green-700 font-medium">
            Deposit successful! Updating balance...
          </span>
        </div>
      )}

      {txStatus === 'error' && errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
          <XCircle className="text-red-600" size={20} />
          <span className="text-sm text-red-700 font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Deposits can be withdrawn anytime (if not used as collateral)</p>
        <p>• Use deposited STX as collateral to borrow</p>
        <p>• Small network fee (~0.001 STX) will be deducted</p>
      </div>
    </div>
  );
};

export default DepositCard;
