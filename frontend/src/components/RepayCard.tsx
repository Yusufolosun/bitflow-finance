import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useVault } from '../hooks/useVault';
import { formatSTX } from '../types/vault';

/**
 * RepayCard Component
 * Allows users to repay their active loan with accrued interest
 */
export const RepayCard: React.FC = () => {
  const { address, balanceSTX, userSession } = useAuth();
  const vault = useVault(userSession, address);

  const [activeLoan, setActiveLoan] = useState<any>(null);
  const [repaymentAmount, setRepaymentAmount] = useState<any>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [timeElapsed, setTimeElapsed] = useState('');

  // Fetch active loan and repayment amount once on mount
  useEffect(() => {
    const fetchData = async () => {
      if (address) {
        const loan = await vault.getUserLoan();
        setActiveLoan(loan);

        if (loan) {
          const repayment = await vault.getRepaymentAmount();
          setRepaymentAmount(repayment);

          // Calculate time elapsed
          const now = Date.now() / 1000;
          const elapsed = now - loan.startTimestamp;
          const days = Math.floor(elapsed / 86400);
          const hours = Math.floor((elapsed % 86400) / 3600);
          const minutes = Math.floor((elapsed % 3600) / 60);

          if (days > 0) {
            setTimeElapsed(`${days}d ${hours}h`);
          } else if (hours > 0) {
            setTimeElapsed(`${hours}h ${minutes}m`);
          } else {
            setTimeElapsed(`${minutes}m`);
          }
        }
      }
    };

    fetchData();
    // Auto-refresh disabled to prevent rate limiting
  }, [address]); // Only re-fetch when address changes

  const handleRepay = async () => {
    if (!repaymentAmount) {
      setErrorMessage('Unable to calculate repayment amount');
      setTxStatus('error');
      return;
    }

    // Check if user has enough balance
    if (balanceSTX < repaymentAmount.totalSTX) {
      setErrorMessage(`Insufficient balance. You need ${formatSTX(repaymentAmount.totalSTX)} STX`);
      setTxStatus('error');
      return;
    }

    setTxStatus('pending');
    setErrorMessage('');

    try {
      const result = await vault.repay();

      if (result.success) {
        setTxStatus('success');
        setTimeout(async () => {
          const loan = await vault.getUserLoan();
          setActiveLoan(loan);
          setRepaymentAmount(null);
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

  // Calculate loan progress
  const getLoanProgress = () => {
    if (!activeLoan) return 0;
    const now = Date.now() / 1000;
    const elapsed = now - activeLoan.startTimestamp;
    const termSeconds = activeLoan.durationDays * 86400;
    return Math.min((elapsed / termSeconds) * 100, 100);
  };

  // No active loan
  if (!activeLoan) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gray-100 rounded-lg">
            <DollarSign className="text-gray-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Repay Loan</h3>
            <p className="text-sm text-gray-500">No active loan to repay</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <AlertCircle className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-600 mb-1 font-medium">No Active Loan</p>
          <p className="text-sm text-gray-500">
            You don't have any active loans. Borrow STX to see repayment details here.
          </p>
        </div>
      </div>
    );
  }

  const progress = getLoanProgress();
  const isOverdue = progress >= 100;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${isOverdue ? 'bg-red-100' : 'bg-blue-100'}`}>
          <DollarSign className={isOverdue ? 'text-red-600' : 'text-blue-600'} size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Repay Loan</h3>
          <p className="text-sm text-gray-500">Pay back your active loan</p>
        </div>
      </div>

      {/* Loan Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Loan Progress</span>
          <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
            {progress.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isOverdue ? 'bg-red-600' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
        {isOverdue && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle size={16} />
            <span className="font-medium">Loan is overdue! Repay immediately to avoid liquidation</span>
          </div>
        )}
      </div>

      {/* Loan Details */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-semibold text-gray-900 text-sm mb-2">Loan Details</h4>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Original Amount:</span>
          <span className="font-semibold">{formatSTX(activeLoan.amountSTX)} STX</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Interest Rate:</span>
          <span className="font-semibold">{activeLoan.interestRatePercent}% APR</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Loan Term:</span>
          <span className="font-semibold">{activeLoan.durationDays} days</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Collateral Locked:</span>
          <span className="font-semibold">{formatSTX(activeLoan.collateralAmountSTX)} STX</span>
        </div>

        <div className="flex justify-between text-sm items-center">
          <span className="text-gray-600">Time Elapsed:</span>
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-gray-500" />
            <span className="font-semibold">{timeElapsed}</span>
          </div>
        </div>
      </div>

      {/* Repayment Breakdown */}
      {repaymentAmount && (
        <div className={`rounded-lg p-4 space-y-3 ${
          isOverdue ? 'bg-red-50' : 'bg-blue-50'
        }`}>
          <h4 className="font-semibold text-gray-900 text-sm mb-2">Repayment Breakdown</h4>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Principal:</span>
            <span className="font-semibold">{formatSTX(repaymentAmount.principalSTX)} STX</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Interest Accrued:</span>
            <span className="font-semibold">{formatSTX(repaymentAmount.interestSTX)} STX</span>
          </div>

          <div className="border-t border-gray-300 pt-2 mt-2"></div>

          <div className="flex justify-between">
            <span className="text-gray-900 font-semibold">Total Repayment:</span>
            <span className={`font-bold text-lg ${
              isOverdue ? 'text-red-600' : 'text-gray-900'
            }`}>
              {formatSTX(repaymentAmount.totalSTX)} STX
            </span>
          </div>
        </div>
      )}

      {/* Current Balance */}
      <div className={`rounded-lg p-3 ${
        repaymentAmount && balanceSTX < repaymentAmount.totalSTX
          ? 'bg-red-50 border border-red-200'
          : 'bg-gray-50'
      }`}>
        <div className="text-xs text-gray-500 mb-1">Your Current Balance</div>
        <div className="text-xl font-bold text-gray-900">
          {formatSTX(balanceSTX)} STX
        </div>
        {repaymentAmount && balanceSTX < repaymentAmount.totalSTX && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1 font-medium">
            <AlertCircle size={12} className="flex-shrink-0" />
            <span>
              Need {formatSTX(repaymentAmount.totalSTX - balanceSTX)} more STX to repay
            </span>
          </div>
        )}
        {repaymentAmount && balanceSTX >= repaymentAmount.totalSTX && (
          <div className="text-xs text-green-600 mt-1 font-medium">
            ✓ Sufficient balance for full repayment
          </div>
        )}
      </div>

      {/* Repay Button */}
      <button
        onClick={handleRepay}
        disabled={
          !address ||
          txStatus === 'pending' ||
          !repaymentAmount ||
          balanceSTX < (repaymentAmount?.totalSTX || 0)
        }
        className={`w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
          isOverdue
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        } disabled:bg-gray-300 disabled:cursor-not-allowed`}
      >
        {txStatus === 'pending' && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        )}
        {txStatus === 'pending' ? 'Processing...' : 'Repay Loan'}
      </button>

      {/* Status Messages */}
      {txStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
          <CheckCircle className="text-green-600" size={20} />
          <span className="text-sm text-green-700 font-medium">
            Loan repaid successfully! Collateral released.
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
        <p>• Repaying releases your locked collateral immediately</p>
        <p>• Interest is calculated based on time elapsed</p>
        {isOverdue && (
          <p className="text-red-600 font-medium">
            ⚠️ Overdue loans are at risk of liquidation
          </p>
        )}
      </div>
    </div>
  );
};

export default RepayCard;
