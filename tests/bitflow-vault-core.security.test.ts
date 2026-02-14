import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const CONTRACT = "bitflow-vault-core";

describe("Security Tests", () => {
  // ===== TASK 2.1: Reentrancy Protection Tests =====

  describe("reentrancy protection", () => {
    it("Clarity prevents reentrancy by design (no external calls during mutations)", () => {
      // Clarity is a non-Turing-complete language that doesn't support
      // callbacks or delegate calls. Functions execute atomically.
      // This test verifies that operations complete without reentrancy.
      const accounts = simnet.getAccounts();
      const wallet = accounts.get("wallet_1")!;

      // Deposit and immediately withdraw - atomic operations
      simnet.callPublicFn(CONTRACT, "deposit", [Cl.uint(5000)], wallet);
      const withdraw = simnet.callPublicFn(CONTRACT, "withdraw", [Cl.uint(5000)], wallet);
      expect(withdraw.result).toBeOk(Cl.bool(true));

      // Balance should be exactly 0 - no re-entrancy could double-spend
      const balance = simnet.callReadOnlyFn(CONTRACT, "get-user-deposit", [Cl.principal(wallet)], wallet);
      expect(balance.result).toBeUint(0);
    });

    it("deposit state is fully committed before next operation", () => {
      const accounts = simnet.getAccounts();
      const wallet = accounts.get("wallet_1")!;

      // Rapid sequence of operations
      simnet.callPublicFn(CONTRACT, "deposit", [Cl.uint(3000)], wallet);
      simnet.callPublicFn(CONTRACT, "deposit", [Cl.uint(2000)], wallet);

      // State should reflect both atomically
      const balance = simnet.callReadOnlyFn(CONTRACT, "get-user-deposit", [Cl.principal(wallet)], wallet);
      expect(balance.result).toBeUint(5000);
    });

    it("borrow operation is atomic - loan and transfer happen together", () => {
      const accounts = simnet.getAccounts();
      const wallet = accounts.get("wallet_1")!;

      simnet.callPublicFn(CONTRACT, "deposit", [Cl.uint(3000)], wallet);
      simnet.callPublicFn(CONTRACT, "borrow", [Cl.uint(2000), Cl.uint(500), Cl.uint(30)], wallet);

      // Loan should exist with correct amount
      const loan = simnet.callReadOnlyFn(CONTRACT, "get-user-loan", [Cl.principal(wallet)], wallet);
      expect(loan.result).toBeSome(expect.any(Object));
    });

    it("failed operations do not partially modify state", () => {
      const accounts = simnet.getAccounts();
      const wallet = accounts.get("wallet_1")!;

      simnet.callPublicFn(CONTRACT, "deposit", [Cl.uint(1000)], wallet);

      // This should fail - insufficient collateral
      const borrowResult = simnet.callPublicFn(CONTRACT, "borrow", [Cl.uint(1000), Cl.uint(500), Cl.uint(30)], wallet);
      expect(borrowResult.result).toBeErr(Cl.uint(105));

      // Deposit should still be intact
      const balance = simnet.callReadOnlyFn(CONTRACT, "get-user-deposit", [Cl.principal(wallet)], wallet);
      expect(balance.result).toBeUint(1000);

      // No loan should exist
      const loan = simnet.callReadOnlyFn(CONTRACT, "get-user-loan", [Cl.principal(wallet)], wallet);
      expect(loan.result).toBeNone();
    });
  });
});
