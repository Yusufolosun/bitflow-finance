# API Code Examples

> **Working code examples for every contract function in BitFlow Finance.**

All examples use `@stacks/transactions@6.13.0` and target the mainnet contract at `SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193.bitflow-vault-core`.

---

## Setup

```typescript
import {
  callReadOnlyFunction,
  makeContractCall,
  broadcastTransaction,
  uintCV,
  principalCV,
  cvToValue,
  FungibleConditionCode,
  makeStandardSTXPostCondition,
  AnchorMode,
} from '@stacks/transactions';

const CONTRACT_ADDRESS = 'SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193';
const CONTRACT_NAME = 'bitflow-vault-core';
const MICRO_STX = 1_000_000;
const NETWORK = 'mainnet';
```

---

## Public Functions (State-Changing)

### deposit(amount)

Deposit STX into the vault as collateral.

```typescript
import { openContractCall } from '@stacks/connect';

async function depositSTX(amountSTX: number, senderAddress: string) {
  const amountMicro = Math.floor(amountSTX * MICRO_STX);

  // Validate before calling
  if (amountSTX <= 0) throw new Error('Amount must be greater than 0');

  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'deposit',
    functionArgs: [uintCV(amountMicro)],
    postConditions: [
      makeStandardSTXPostCondition(
        senderAddress,
        FungibleConditionCode.Equal,
        amountMicro
      ),
    ],
    network: NETWORK,
    onFinish: (data) => {
      console.log('Deposit TX:', data.txId);
    },
    onCancel: () => {
      console.log('Deposit cancelled by user');
    },
  });
}

// Usage
await depositSTX(10, 'SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193');
```

**Possible errors:**
- `u102` — Amount is 0

### withdraw(amount)

Withdraw STX from the vault back to your wallet.

```typescript
async function withdrawSTX(amountSTX: number, senderAddress: string) {
  const amountMicro = Math.floor(amountSTX * MICRO_STX);

  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'withdraw',
    functionArgs: [uintCV(amountMicro)],
    network: NETWORK,
    onFinish: (data) => {
      console.log('Withdraw TX:', data.txId);
    },
  });
}

// Usage
await withdrawSTX(5, 'SP...');
```

**Possible errors:**
- `u101` — Insufficient deposit balance
- `u102` — Amount is 0

### borrow(amount, interest-rate, term-days)

Borrow STX against your collateral.

```typescript
async function borrowSTX(
  amountSTX: number,
  rateBPS: number,
  termDays: number,
  senderAddress: string
) {
  const amountMicro = Math.floor(amountSTX * MICRO_STX);

  // Pre-flight validation
  if (amountSTX <= 0) throw new Error('Amount must be > 0');
  if (rateBPS < 1 || rateBPS > 10000) throw new Error('Rate must be 1-10000 BPS');
  if (termDays < 1 || termDays > 365) throw new Error('Term must be 1-365 days');

  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'borrow',
    functionArgs: [
      uintCV(amountMicro),
      uintCV(rateBPS),
      uintCV(termDays),
    ],
    network: NETWORK,
    onFinish: (data) => {
      console.log('Borrow TX:', data.txId);
    },
  });
}

// Usage: borrow 5 STX at 5% APR for 30 days
await borrowSTX(5, 500, 30, 'SP...');
```

**Possible errors:**
- `u102` — Amount is 0
- `u103` — Already has an active loan
- `u105` — Insufficient collateral (need 150%)
- `u110` — Interest rate > 10000
- `u111` — Term outside 1-365 range

### repay()

Repay your active loan (principal + interest).

```typescript
async function repayLoan(senderAddress: string) {
  // First, check repayment amount
  const repaymentInfo = await getRepaymentAmount(senderAddress);
  if (!repaymentInfo) throw new Error('No active loan');

  console.log(`Repaying: ${repaymentInfo.total / MICRO_STX} STX`);

  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'repay',
    functionArgs: [],
    postConditions: [
      makeStandardSTXPostCondition(
        senderAddress,
        FungibleConditionCode.LessEqual,
        repaymentInfo.total
      ),
    ],
    network: NETWORK,
    onFinish: (data) => {
      console.log('Repay TX:', data.txId);
    },
  });
}
```

**Possible errors:**
- `u106` — No active loan

### liquidate(borrower, stx-price)

Liquidate an undercollateralized loan.

```typescript
async function liquidateLoan(
  borrowerAddress: string,
  stxPrice: number,
  senderAddress: string
) {
  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'liquidate',
    functionArgs: [
      principalCV(borrowerAddress),
      uintCV(stxPrice),
    ],
    network: NETWORK,
    onFinish: (data) => {
      console.log('Liquidation TX:', data.txId);
      // Returns: { seized-collateral, paid, bonus }
    },
  });
}

// Usage
await liquidateLoan('SP_BORROWER_ADDRESS', 1_000_000, 'SP_LIQUIDATOR');
```

**Possible errors:**
- `u106` — Borrower has no active loan
- `u107` — Health factor >= 110% (not liquidatable)
- `u108` — Cannot self-liquidate

### initialize()

One-time protocol initialization (owner only).

```typescript
async function initializeProtocol(ownerAddress: string) {
  await openContractCall({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: 'initialize',
    functionArgs: [],
    network: NETWORK,
  });
}
```

**Possible errors:**
- `u109` — Not the contract owner

---

## Related Documentation

- [API Reference](API.md) — Detailed read-only function docs
- [Error Codes](ERRORS.md) — All error codes explained
- [Contracts Reference](CONTRACTS.md) — Contract architecture
- [Integration Guide](INTEGRATION.md) — Framework integration
