import { useState, useCallback } from 'react';
import { openContractCall } from '@stacks/connect';
import {
  callReadOnlyFunction,
  uintCV,
  principalCV,
  ClarityType,
  cvToValue,
} from '@stacks/transactions';
import { 
  UserDeposit, 
  UserLoan, 
  RepaymentAmount,
  ContractCallResponse,
  microStxToStx,
  stxToMicroStx,
} from '../types/vault';
import { 
  getNetwork, 
  getContractAddress, 
  VAULT_CONTRACT,
  PROTOCOL_CONSTANTS,
} from '../config/contracts';
import { UserSession } from '@stacks/connect';

/**
 * Custom hook for vault operations
 * Handles all interactions with the vault-core contract
 */
export const useVault = (userSession: UserSession, userAddress: string | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const network = getNetwork();
  const contractAddress = getContractAddress();
  const contractName = VAULT_CONTRACT.name;

  /**
   * Deposit STX into the vault
   */
  const deposit = useCallback(async (amountSTX: number): Promise<ContractCallResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const amountMicroSTX = stxToMicroStx(amountSTX);

      const result = await openContractCall({
        network,
        contractAddress,
        contractName,
        functionName: 'deposit',
        functionArgs: [uintCV(amountMicroSTX)],
        postConditions: [],
        onFinish: (data) => {
          console.log('Deposit transaction:', data.txId);
        },
        onCancel: () => {
          console.log('Deposit cancelled');
        },
      });

      setIsLoading(false);
      return { success: true, txId: result.txId };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to deposit';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  }, [userAddress, network, contractAddress, contractName]);

  /**
   * Withdraw STX from the vault
   */
  const withdraw = useCallback(async (amountSTX: number): Promise<ContractCallResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const amountMicroSTX = stxToMicroStx(amountSTX);

      const result = await openContractCall({
        network,
        contractAddress,
        contractName,
        functionName: 'withdraw',
        functionArgs: [uintCV(amountMicroSTX)],
        postConditions: [],
        onFinish: (data) => {
          console.log('Withdraw transaction:', data.txId);
        },
        onCancel: () => {
          console.log('Withdraw cancelled');
        },
      });

      setIsLoading(false);
      return { success: true, txId: result.txId };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to withdraw';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  }, [userAddress, network, contractAddress, contractName]);

  /**
   * Borrow STX against collateral
   */
  const borrow = useCallback(async (
    amountSTX: number,
    interestRatePercent: number,
    termDays: number
  ): Promise<ContractCallResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const amountMicroSTX = stxToMicroStx(amountSTX);
      const interestRateBPS = interestRatePercent * 100; // Convert to basis points

      const result = await openContractCall({
        network,
        contractAddress,
        contractName,
        functionName: 'borrow',
        functionArgs: [
          uintCV(amountMicroSTX),
          uintCV(interestRateBPS),
          uintCV(termDays),
        ],
        postConditions: [],
        onFinish: (data) => {
          console.log('Borrow transaction:', data.txId);
        },
        onCancel: () => {
          console.log('Borrow cancelled');
        },
      });

      setIsLoading(false);
      return { success: true, txId: result.txId };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to borrow';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  }, [userAddress, network, contractAddress, contractName]);

  /**
   * Repay active loan
   */
  const repay = useCallback(async (): Promise<ContractCallResponse> => {
    if (!userAddress) {
      return { success: false, error: 'Wallet not connected' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await openContractCall({
        network,
        contractAddress,
        contractName,
        functionName: 'repay',
        functionArgs: [],
        postConditions: [],
        onFinish: (data) => {
          console.log('Repay transaction:', data.txId);
        },
        onCancel: () => {
          console.log('Repay cancelled');
        },
      });

      setIsLoading(false);
      return { success: true, txId: result.txId };
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to repay';
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  }, [userAddress, network, contractAddress, contractName]);

  /**
   * Get user's deposit balance
   */
  const getUserDeposit = useCallback(async (): Promise<UserDeposit | null> => {
    if (!userAddress) return null;

    try {
      const result = await callReadOnlyFunction({
        network,
        contractAddress,
        contractName,
        functionName: 'get-user-deposit',
        functionArgs: [principalCV(userAddress)],
        senderAddress: userAddress,
      });

      if (result.type === ClarityType.UInt) {
        const amount = result.value;
        const amountSTX = microStxToStx(amount);

        // Calculate available to withdraw (assuming no active loan for now)
        // In a real implementation, you'd check if there's an active loan
        const availableToWithdraw = amount;
        const availableToWithdrawSTX = amountSTX;

        return {
          amount,
          amountSTX,
          availableToWithdraw,
          availableToWithdrawSTX,
        };
      }

      return null;
    } catch (err) {
      console.error('Error fetching user deposit:', err);
      return null;
    }
  }, [userAddress, network, contractAddress, contractName]);

  /**
   * Get user's active loan
   */
  const getUserLoan = useCallback(async (): Promise<UserLoan | null> => {
    if (!userAddress) return null;

    try {
      const result = await callReadOnlyFunction({
        network,
        contractAddress,
        contractName,
        functionName: 'get-user-loan',
        functionArgs: [principalCV(userAddress)],
        senderAddress: userAddress,
      });

      if (result.type === ClarityType.OptionalSome) {
        const loanData = cvToValue(result.value);
        
        const amount = BigInt(loanData.amount);
        const interestRate = Number(loanData['interest-rate']);
        const startBlock = Number(loanData['start-block']);
        const termEnd = Number(loanData['term-end']);

        const amountSTX = microStxToStx(amount);
        const interestRatePercent = interestRate / 100;
        const durationDays = Math.floor((termEnd - startBlock) / 144); // Approx blocks per day

        // Calculate required collateral
        const collateralAmount = (amount * BigInt(PROTOCOL_CONSTANTS.MIN_COLLATERAL_RATIO)) / BigInt(100);
        const collateralAmountSTX = microStxToStx(collateralAmount);

        return {
          amount,
          amountSTX,
          interestRate,
          interestRatePercent,
          startBlock,
          termEnd,
          durationDays,
          collateralAmount,
          collateralAmountSTX,
        };
      }

      return null;
    } catch (err) {
      console.error('Error fetching user loan:', err);
      return null;
    }
  }, [userAddress, network, contractAddress, contractName]);

  /**
   * Get repayment amount for active loan
   */
  const getRepaymentAmount = useCallback(async (): Promise<RepaymentAmount | null> => {
    if (!userAddress) return null;

    try {
      const result = await callReadOnlyFunction({
        network,
        contractAddress,
        contractName,
        functionName: 'get-repayment-amount',
        functionArgs: [principalCV(userAddress)],
        senderAddress: userAddress,
      });

      if (result.type === ClarityType.OptionalSome) {
        const repaymentData = cvToValue(result.value);
        
        const principal = BigInt(repaymentData.principal);
        const interest = BigInt(repaymentData.interest);
        const total = BigInt(repaymentData.total);

        return {
          principal,
          principalSTX: microStxToStx(principal),
          interest,
          interestSTX: microStxToStx(interest),
          total,
          totalSTX: microStxToStx(total),
        };
      }

      return null;
    } catch (err) {
      console.error('Error fetching repayment amount:', err);
      return null;
    }
  }, [userAddress, network, contractAddress, contractName]);

  /**
   * Calculate health factor
   */
  const getHealthFactor = useCallback(async (stxPriceUSD: number): Promise<number | null> => {
    if (!userAddress) return null;

    try {
      // Price with 6 decimals (e.g., $1.00 = 1000000)
      const priceWithDecimals = Math.floor(stxPriceUSD * 1_000_000);

      const result = await callReadOnlyFunction({
        network,
        contractAddress,
        contractName,
        functionName: 'calculate-health-factor',
        functionArgs: [
          principalCV(userAddress),
          uintCV(priceWithDecimals),
        ],
        senderAddress: userAddress,
      });

      if (result.type === ClarityType.OptionalSome && result.value.type === ClarityType.UInt) {
        return Number(result.value.value);
      }

      return null;
    } catch (err) {
      console.error('Error calculating health factor:', err);
      return null;
    }
  }, [userAddress, network, contractAddress, contractName]);

  return {
    // State
    isLoading,
    error,

    // Write operations
    deposit,
    withdraw,
    borrow,
    repay,

    // Read operations
    getUserDeposit,
    getUserLoan,
    getRepaymentAmount,
    getHealthFactor,
  };
};

export default useVault;
