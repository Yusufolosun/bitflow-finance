import { describe, expect, it } from 'vitest';
import { Cl } from '@stacks/transactions';

const accounts = simnet.getAccounts();
const deployer = accounts.get('deployer')!;
const wallet1 = accounts.get('wallet_1')!;
const wallet2 = accounts.get('wallet_2')!;
const wallet3 = accounts.get('wallet_3')!;

describe('Vault Edge Cases - Boundary Conditions', () => {
  describe('Minimum Collateral Borrowing', () => {
    it('should allow borrowing with exactly minimum collateral (150%)', () => {
      // Deposit exactly enough for minimum collateral ratio
      const borrowAmount = 1000000; // 1 STX in micro-STX
      const minCollateral = 1500000; // Exactly 1.5 STX (150% ratio)
      
      // User deposits minimum required collateral
      const depositResult = simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(minCollateral)],
        wallet1
      );
      expect(depositResult.result).toBeOk(Cl.bool(true));
      
      // Attempt to borrow with exactly minimum collateral
      const borrowResult = simnet.callPublicFn(
        'vault-core',
        'borrow',
        [Cl.uint(borrowAmount), Cl.uint(10), Cl.uint(30)],
        wallet1
      );
      expect(borrowResult.result).toBeOk(Cl.bool(true));
      
      // Verify loan was created
      const loan = simnet.getMapEntry('vault-core', 'user-loans', Cl.principal(wallet1));
      expect(loan).toBeSome();
    });

    it('should reject borrowing with insufficient collateral (149.9%)', () => {
      // Deposit slightly less than minimum collateral
      const borrowAmount = 1000000; // 1 STX
      const insufficientCollateral = 1499000; // 1.499 STX (just under 150%)
      
      const depositResult = simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(insufficientCollateral)],
        wallet2
      );
      expect(depositResult.result).toBeOk(Cl.bool(true));
      
      // Attempt to borrow should fail
      const borrowResult = simnet.callPublicFn(
        'vault-core',
        'borrow',
        [Cl.uint(borrowAmount), Cl.uint(10), Cl.uint(30)],
        wallet2
      );
      expect(borrowResult.result).toBeErr(Cl.uint(103)); // ERR-INSUFFICIENT-COLLATERAL
    });

    it('should allow borrowing maximum amount based on deposit', () => {
      const depositAmount = 10000000; // 10 STX
      const maxBorrowAmount = 6666666; // ~6.67 STX (10/1.5)
      
      const depositResult = simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(depositAmount)],
        wallet3
      );
      expect(depositResult.result).toBeOk(Cl.bool(true));
      
      // Get max borrow amount
      const maxBorrow = simnet.callReadOnlyFn(
        'vault-core',
        'get-max-borrow-amount',
        [Cl.principal(wallet3)],
        wallet3
      );
      expect(maxBorrow.result).toBeSome(Cl.uint(maxBorrowAmount));
      
      // Borrow maximum allowed amount
      const borrowResult = simnet.callPublicFn(
        'vault-core',
        'borrow',
        [Cl.uint(maxBorrowAmount), Cl.uint(10), Cl.uint(30)],
        wallet3
      );
      expect(borrowResult.result).toBeOk(Cl.bool(true));
    });
  });

  describe('Liquidation Threshold Tests', () => {
    it('should repay successfully at exact liquidation threshold (110%)', () => {
      const depositAmount = 11000000; // 11 STX
      const borrowAmount = 10000000; // 10 STX (110% ratio)
      const stxPrice = 1000000; // $1 per STX (for health factor calc)
      
      // Setup: deposit and borrow
      simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(depositAmount)],
        wallet1
      );
      
      simnet.callPublicFn(
        'vault-core',
        'borrow',
        [Cl.uint(borrowAmount), Cl.uint(10), Cl.uint(30)],
        wallet1
      );
      
      // Advance some blocks to accrue interest
      simnet.mineEmptyBlocks(100);
      
      // Check health factor is at liquidation threshold
      const healthFactor = simnet.callReadOnlyFn(
        'vault-core',
        'calculate-health-factor',
        [Cl.principal(wallet1), Cl.uint(stxPrice)],
        wallet1
      );
      expect(healthFactor.result).toBeUint(110); // Exactly at threshold
      
      // User should still be able to repay
      const repayResult = simnet.callPublicFn(
        'vault-core',
        'repay',
        [],
        wallet1
      );
      expect(repayResult.result).toBeOk(Cl.tuple({
        principal: Cl.uint(borrowAmount),
        interest: Cl.uint(expect.any(Number)),
        total: Cl.uint(expect.any(Number))
      }));
    });

    it('should be liquidatable when health factor falls below 110%', () => {
      const depositAmount = 10900000; // 10.9 STX
      const borrowAmount = 10000000; // 10 STX (109% ratio - below threshold)
      const stxPrice = 1000000;
      
      simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(depositAmount)],
        wallet2
      );
      
      simnet.callPublicFn(
        'vault-core',
        'borrow',
        [Cl.uint(borrowAmount), Cl.uint(10), Cl.uint(30)],
        wallet2
      );
      
      // Check if liquidatable
      const isLiquidatable = simnet.callReadOnlyFn(
        'vault-core',
        'is-liquidatable',
        [Cl.principal(wallet2), Cl.uint(stxPrice)],
        deployer
      );
      expect(isLiquidatable.result).toBeBool(true);
      
      // Liquidate
      const liquidateResult = simnet.callPublicFn(
        'vault-core',
        'liquidate',
        [Cl.principal(wallet2), Cl.uint(stxPrice)],
        deployer
      );
      expect(liquidateResult.result).toBeOk(Cl.tuple({
        'seized-collateral': Cl.uint(depositAmount),
        paid: Cl.uint(expect.any(Number)),
        bonus: Cl.uint(expect.any(Number))
      }));
    });

    it('should not be liquidatable above 110% threshold', () => {
      const depositAmount = 11100000; // 11.1 STX
      const borrowAmount = 10000000; // 10 STX (111% ratio - above threshold)
      const stxPrice = 1000000;
      
      simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(depositAmount)],
        wallet3
      );
      
      simnet.callPublicFn(
        'vault-core',
        'borrow',
        [Cl.uint(borrowAmount), Cl.uint(10), Cl.uint(30)],
        wallet3
      );
      
      // Check if liquidatable
      const isLiquidatable = simnet.callReadOnlyFn(
        'vault-core',
        'is-liquidatable',
        [Cl.principal(wallet3), Cl.uint(stxPrice)],
        deployer
      );
      expect(isLiquidatable.result).toBeBool(false);
      
      // Attempt liquidation should fail
      const liquidateResult = simnet.callPublicFn(
        'vault-core',
        'liquidate',
        [Cl.principal(wallet3), Cl.uint(stxPrice)],
        deployer
      );
      expect(liquidateResult.result).toBeErr(Cl.uint(107)); // ERR-NOT-LIQUIDATABLE
    });
  });

  describe('Multiple Users Concurrent Operations', () => {
    it('should handle multiple users depositing simultaneously', () => {
      const amount1 = 5000000; // 5 STX
      const amount2 = 10000000; // 10 STX
      const amount3 = 15000000; // 15 STX
      
      // All users deposit
      const deposit1 = simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(amount1)],
        wallet1
      );
      const deposit2 = simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(amount2)],
        wallet2
      );
      const deposit3 = simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(amount3)],
        wallet3
      );
      
      expect(deposit1.result).toBeOk(Cl.bool(true));
      expect(deposit2.result).toBeOk(Cl.bool(true));
      expect(deposit3.result).toBeOk(Cl.bool(true));
      
      // Verify total deposits
      const stats = simnet.callReadOnlyFn(
        'vault-core',
        'get-protocol-stats',
        [],
        deployer
      );
      expect(stats.result).toBeOk(Cl.tuple({
        'total-deposits': Cl.uint(amount1 + amount2 + amount3),
        'total-repaid': Cl.uint(0),
        'total-liquidations': Cl.uint(0)
      }));
    });

    it('should maintain separate loan states for multiple borrowers', () => {
      // Setup: Each user deposits and borrows
      const users = [
        { wallet: wallet1, deposit: 15000000, borrow: 10000000, rate: 10 },
        { wallet: wallet2, deposit: 30000000, borrow: 20000000, rate: 15 },
        { wallet: wallet3, deposit: 45000000, borrow: 30000000, rate: 20 }
      ];
      
      users.forEach(user => {
        simnet.callPublicFn(
          'vault-core',
          'deposit',
          [Cl.uint(user.deposit)],
          user.wallet
        );
        
        simnet.callPublicFn(
          'vault-core',
          'borrow',
          [Cl.uint(user.borrow), Cl.uint(user.rate), Cl.uint(30)],
          user.wallet
        );
      });
      
      // Verify each user has correct loan
      users.forEach(user => {
        const loan = simnet.getMapEntry(
          'vault-core',
          'user-loans',
          Cl.principal(user.wallet)
        );
        expect(loan).toBeSome(Cl.tuple({
          amount: Cl.uint(user.borrow),
          'interest-rate': Cl.uint(user.rate),
          'start-block': Cl.uint(expect.any(Number)),
          'term-end': Cl.uint(expect.any(Number))
        }));
      });
    });

    it('should handle user repaying while others have active loans', () => {
      // User 1 deposits and borrows
      simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(15000000)],
        wallet1
      );
      simnet.callPublicFn(
        'vault-core',
        'borrow',
        [Cl.uint(10000000), Cl.uint(10), Cl.uint(30)],
        wallet1
      );
      
      // User 2 deposits and borrows
      simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(30000000)],
        wallet2
      );
      simnet.callPublicFn(
        'vault-core',
        'borrow',
        [Cl.uint(20000000), Cl.uint(15), Cl.uint(30)],
        wallet2
      );
      
      // User 1 repays
      const repayResult = simnet.callPublicFn(
        'vault-core',
        'repay',
        [],
        wallet1
      );
      expect(repayResult.result).toBeOk(Cl.tuple({
        principal: Cl.uint(10000000),
        interest: Cl.uint(expect.any(Number)),
        total: Cl.uint(expect.any(Number))
      }));
      
      // User 1 should have no loan
      const loan1 = simnet.getMapEntry(
        'vault-core',
        'user-loans',
        Cl.principal(wallet1)
      );
      expect(loan1).toBeNone();
      
      // User 2 should still have their loan
      const loan2 = simnet.getMapEntry(
        'vault-core',
        'user-loans',
        Cl.principal(wallet2)
      );
      expect(loan2).toBeSome();
    });

    it('should track comprehensive position summary for all users', () => {
      const stxPrice = 1000000;
      
      // Setup user with deposit and loan
      simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(20000000)],
        wallet1
      );
      simnet.callPublicFn(
        'vault-core',
        'borrow',
        [Cl.uint(10000000), Cl.uint(10), Cl.uint(30)],
        wallet1
      );
      
      // Get position summary
      const summary = simnet.callReadOnlyFn(
        'vault-core',
        'get-user-position-summary',
        [Cl.principal(wallet1), Cl.uint(stxPrice)],
        deployer
      );
      
      expect(summary.result).toBeOk(Cl.tuple({
        'deposit-amount': Cl.uint(20000000),
        'has-loan': Cl.bool(true),
        'loan-amount': Cl.uint(10000000),
        'loan-interest-rate': Cl.uint(10),
        'loan-term-end': Cl.uint(expect.any(Number)),
        'health-factor': Cl.uint(200), // 200% health factor
        'is-liquidatable': Cl.bool(false),
        'max-borrow-available': Cl.uint(expect.any(Number)),
        'collateral-usage-percent': Cl.uint(50) // 50% of collateral used
      }));
    });
  });

  describe('Zero and Boundary Value Tests', () => {
    it('should reject zero amount deposits', () => {
      const result = simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(0)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(101)); // ERR-INVALID-AMOUNT
    });

    it('should reject zero amount borrows', () => {
      // Setup: deposit first
      simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(10000000)],
        wallet1
      );
      
      const result = simnet.callPublicFn(
        'vault-core',
        'borrow',
        [Cl.uint(0), Cl.uint(10), Cl.uint(30)],
        wallet1
      );
      expect(result.result).toBeErr(Cl.uint(101)); // ERR-INVALID-AMOUNT
    });

    it('should handle maximum uint values safely', () => {
      // Attempt to deposit maximum uint
      const maxUint = 340282366920938463463374607431768211455n; // u128 max
      
      const result = simnet.callPublicFn(
        'vault-core',
        'deposit',
        [Cl.uint(maxUint)],
        wallet1
      );
      
      // Should fail due to insufficient STX balance
      expect(result.result).toBeErr(Cl.uint(expect.any(Number)));
    });
  });
});
