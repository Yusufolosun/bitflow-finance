import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

describe("vault-core contract", () => {
  it("allows users to deposit STX", () => {
    const accounts = simnet.getAccounts();
    const wallet_1 = accounts.get("wallet_1")!;


    // Call deposit with 1000 STX from wallet_1
    const depositAmount = 1000;
    const { result } = simnet.callPublicFn(
      "vault-core",
      "deposit",
      [Cl.uint(depositAmount)],
      wallet_1
    );

    // Verify result is ok
    expect(result).toBeOk(Cl.bool(true));

    // Verify get-user-deposit returns 1000
    const userDepositResponse = simnet.callReadOnlyFn(
      "vault-core",
      "get-user-deposit",
      [Cl.principal(wallet_1)],
      wallet_1
    );
    expect(userDepositResponse.result).toBeUint(depositAmount);
  });

  it("allows users to withdraw their deposits", () => {
    const accounts = simnet.getAccounts();
    const wallet_1 = accounts.get("wallet_1")!;

    // Deposit 1000 STX
    const depositAmount = 1000;
    const depositResponse = simnet.callPublicFn(
      "vault-core",
      "deposit",
      [Cl.uint(depositAmount)],
      wallet_1
    );
    expect(depositResponse.result).toBeOk(Cl.bool(true));

    // Withdraw 500 STX
    const withdrawAmount = 500;
    const withdrawResponse = simnet.callPublicFn(
      "vault-core",
      "withdraw",
      [Cl.uint(withdrawAmount)],
      wallet_1
    );

    // Verify both transactions succeed
    expect(withdrawResponse.result).toBeOk(Cl.bool(true));

    // Verify remaining balance is 500
    const userDepositResponse = simnet.callReadOnlyFn(
      "vault-core",
      "get-user-deposit",
      [Cl.principal(wallet_1)],
      wallet_1
    );
    expect(userDepositResponse.result).toBeUint(depositAmount - withdrawAmount);
  });

  it("prevents users from withdrawing more than deposited", () => {
    const accounts = simnet.getAccounts();
    const wallet_1 = accounts.get("wallet_1")!;

    // Deposit 1000 STX
    const depositAmount = 1000;
    const depositResponse = simnet.callPublicFn(
      "vault-core",
      "deposit",
      [Cl.uint(depositAmount)],
      wallet_1
    );
    expect(depositResponse.result).toBeOk(Cl.bool(true));

    // Try to withdraw 2000 STX
    const withdrawAmount = 2000;
    const withdrawResponse = simnet.callPublicFn(
      "vault-core",
      "withdraw",
      [Cl.uint(withdrawAmount)],
      wallet_1
    );

    // Verify transaction fails with error u101
    expect(withdrawResponse.result).toBeErr(Cl.uint(101));
  });

  it("tracks total deposits correctly", () => {
    const accounts = simnet.getAccounts();
    const wallet_1 = accounts.get("wallet_1")!;
    const wallet_2 = accounts.get("wallet_2")!;

    // Have wallet_1 deposit 1000
    const wallet1Amount = 1000;
    const deposit1 = simnet.callPublicFn(
      "vault-core",
      "deposit",
      [Cl.uint(wallet1Amount)],
      wallet_1
    );
    expect(deposit1.result).toBeOk(Cl.bool(true));

    // Have wallet_2 deposit 2000
    const wallet2Amount = 2000;
    const deposit2 = simnet.callPublicFn(
      "vault-core",
      "deposit",
      [Cl.uint(wallet2Amount)],
      wallet_2
    );
    expect(deposit2.result).toBeOk(Cl.bool(true));

    // Verify get-total-deposits returns 3000
    const totalDepositsResponse = simnet.callReadOnlyFn(
      "vault-core",
      "get-total-deposits",
      [],
      wallet_1
    );
    expect(totalDepositsResponse.result).toBeUint(wallet1Amount + wallet2Amount);
  });
});
