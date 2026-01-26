import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useVault } from '../hooks/useVault';
import { formatSTX, LOAN_TERMS } from '../types/vault';
import { PROTOCOL_CONSTANTS } from '../config/contracts';

/**
 * BorrowCard Component
 * Allows users to borrow STX against their deposited collateral
 */
export const BorrowCard: React.FC = () => {
  const { address, userSession } = useAuth();
  const vault = useVault(userSession, address);

  const [borrowAmount, setBorrowAmount] = useState('');
  const [interestRate, setInterestRate] = useState(10);
  const [loanTerm, setLoanTerm] = useState(30);
  const [userDeposit, setUserDeposit] = useState(0);
  const [activeLoan, setActiveLoan] = useState<any>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch user deposit and active loan
  // Initial fetch removed to prevent API rate limiting
  // Data will load after user actions
  // useEffect(() => {
  //   const fetchData = async () => {
  //     if (address) {
  //       const deposit = await vault.getUserDeposit();
  //       if (deposit) {
  //         setUserDeposit(deposit.amountSTX);
  //       }
  //
  //       const loan = await vault.getUserLoan();
  //       setHasActiveLoan(!!loan);
  //     }
  //   };
  //
  //   fetchData();
  //   // Auto-refresh disabled to prevent rate limiting
  //   // const interval = setInterval(fetchData, 60000);
  //   // return () => clearInterval(interval);
  // }, [address, vault]);

  // Calculate maximum borrowable amount
  const maxBorrowSTX = userDeposit / (PROTOCOL_CONSTANTS.MIN_COLLATERAL_RATIO / 100);

  // Calculate required collateral
  const amount = parseFloat(borrowAmount || '0');
  const requiredCollateral = amount * (PROTOCOL_CONSTANTS.MIN_COLLATERAL_RATIO / 100);

  // Calculate estimated interest
  const estimatedInterest = (amount * (interestRate / 100) * (loanTerm / 365));
  const totalRepayment = amount + estimatedInterest;

  const handleBorrow = async () => {
    // Validation
    if (!amount || amount <= 0) {
      setErrorMessage('Please enter a valid amount');
      setTxStatus('error');
      return;
    }

    if (amount > maxBorrowSTX) {
      setErrorMessage(`Maximum borrow is ${formatSTX(maxBorrowSTX)} STX`);
      setTxStatus('error');
      return;
    }

    if (requiredCollateral > userDeposit) {
      setErrorMessage('Insufficient collateral');
      setTxStatus('error');
      return;
    }

    if (activeLoan) {
      setErrorMessage('You already have an active loan. Please repay it first.');
      setTxStatus('error');
      return;
    }

    setTxStatus('pending');
    setErrorMessage('');

    try {
      const result = await vault.borrow(amount, interestRate, loanTerm);

      if (result.success) {
        setTxStatus('success');
        setBorrowAmount('');
        setTimeout(async () => {
          const loan = await vault.getUserLoan();
          setActiveLoan(loan);
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
    setBorrowAmount(maxBorrowSTX.toFixed(2));
  };

  // If user has active loan, show message
  if (activeLoan) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <AlertCircle className="text-yellow-600" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Active Loan</h3>
            <p className="text-sm text-gray-500">You already have an active loan</p>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Loan Amount:</span>
            <span className="text-sm font-semibold">{formatSTX(activeLoan.amountSTX)} STX</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Interest Rate:</span>
            <span className="text-sm font-semibold">{activeLoan.interestRatePercent}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Collateral Locked:</span>
            <span className="text-sm font-semibold">{formatSTX(activeLoan.collateralAmountSTX)} STX</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mt-4">
          Please repay your current loan before borrowing again.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 rounded-lg">
          <TrendingUp className="text-green-600" size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Borrow STX</h3>
          <p className="text-sm text-gray-500">Borrow against your collateral</p>
        </div>
      </div>

      {/* Available Collateral */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-xs text-gray-500 mb-1">Available Collateral</div>
        <div className="text-2xl font-bold text-gray-900">
          {formatSTX(userDeposit)} STX
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Max Borrow: {formatSTX(maxBorrowSTX)} STX
        </div>
      </div>

      {/* Borrow Amount Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Borrow Amount
        </label>
        <div className="relative">
          <input
            type="number"
            value={borrowAmount}
            onChange={(e) => setBorrowAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={txStatus === 'pending'}
          />
          <button
            onClick={handleMaxClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-green-100 text-green-600 rounded text-sm font-medium hover:bg-green-200 transition-colors"
            disabled={txStatus === 'pending'}
          >
            MAX
          </button>
        </div>
      </div>

      {/* Interest Rate */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Interest Rate (APR)
        </label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={interestRate}
            onChange={(e) => setInterestRate(parseInt(e.target.value))}
            className="flex-1"
            disabled={txStatus === 'pending'}
          />
          <div className="w-16 px-3 py-2 bg-gray-100 rounded-lg text-center font-semibold">
            {interestRate}%
          </div>
        </div>
      </div>

      {/* Loan Term */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Loan Term
        </label>
        <div className="grid grid-cols-4 gap-2">
          {LOAN_TERMS.map((term) => (
            <button
              key={term.days}
              onClick={() => setLoanTerm(term.days)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                loanTerm === term.days
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              disabled={txStatus === 'pending'}
            >
              {term.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loan Summary */}
      {borrowAmount && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">Loan Summary</h4>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Borrow Amount:</span>
            <span className="font-semibold">{formatSTX(amount)} STX</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Required Collateral:</span>
            <span className="font-semibold">{formatSTX(requiredCollateral)} STX</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Estimated Interest:</span>
            <span className="font-semibold">{formatSTX(estimatedInterest)} STX</span>
          </div>
          <div className="border-t border-blue-200 pt-2 mt-2"></div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-semibold">Total Repayment:</span>
            <span className="font-bold text-gray-900">{formatSTX(totalRepayment)} STX</span>
          </div>
        </div>
      )}

      {/* Borrow Button */}
      <button
        onClick={handleBorrow}
        disabled={!address || txStatus === 'pending' || !borrowAmount || userDeposit === 0}
        className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {txStatus === 'pending' && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        )}
        {txStatus === 'pending' ? 'Borrowing...' : 'Borrow STX'}
      </button>

      {/* Status Messages */}
      {txStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <CheckCircle className="text-green-600" size={20} />
          <span className="text-sm text-green-700 font-medium">
            Loan created successfully!
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
        <p>• {PROTOCOL_CONSTANTS.MIN_COLLATERAL_RATIO}% collateralization required</p>
        <p>• Interest accrues from the moment you borrow</p>
        <p>• Only one active loan allowed at a time</p>
      </div>
    </div>
  );
};

export default BorrowCard;
