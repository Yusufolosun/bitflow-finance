# Health Factor Guide

> **Your complete guide to understanding, calculating, and managing your health factor.**

The health factor is the single most important number to monitor when you have an active loan on BitFlow Finance. It determines whether your position is safe or at risk of liquidation.

---

## What Is the Health Factor?

The health factor is a ratio that measures how well your collateral (deposit) covers your debt (loan + interest). It's expressed as a percentage:

```
                    deposit value
Health Factor = ─────────────────── × 100
                    total debt
```

A health factor of 150% means your collateral is worth 1.5x your total debt. The higher the health factor, the safer your position.

---

## Health Factor Zones

| Zone | Range | Color | What It Means | Action Required |
|---|---|---|---|---|
| Safe | > 150% | Green | Well-collateralized | None — you're good |
| Warning | 110% – 150% | Amber | Buffer is shrinking | Monitor closely, consider adding collateral |
| Danger | < 110% | Red | Liquidation possible | **Repay immediately** or add collateral |

### Visual Scale

```
  0%          50%         110%        150%        200%        300%+
  ├───────────┼────────────┤───────────┤───────────┤───────────┤
  │        DANGER          │  WARNING  │       SAFE            │
  │   Liquidation zone     │  Monitor  │   No action needed    │
  │   (red)                │  (amber)  │   (green)             │
  └────────────────────────┴───────────┴───────────────────────┘
```

---

## How It Changes Over Time

Your health factor can decrease for two reasons:

### 1. Interest Accrual (Gradual)

As interest accumulates on your loan, your total debt increases, which lowers the health factor.

```
  Health Factor
  300% ┤
       │  ●
  250% ┤    ●
       │       ●
  200% ┤          ●
       │             ●
  150% ┤─ ─ ─ ─ ─ ─ ─ ─●─ ─ ─ ─ ─  (minimum borrow requirement)
       │                   ●
  110% ┤─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ●─ ─  (liquidation threshold)
       │                       ●
       ├───┬───┬───┬───┬───┬───┬───
       0   30  60  90  120 150 180  days
```

The rate of decline depends on your interest rate and how much you borrowed.

### 2. Adding Collateral (Increase)

Depositing more STX increases the numerator, raising your health factor:

```
  Health Factor
  300% ┤
       │
  250% ┤      ● (deposit more STX)
       │      ↑
  200% ┤      │
       │  ●───┘
  150% ┤    (health was declining)
       │
  110% ┤
       ├───┬───┬───
       0   15  30    days
```

---

## Health Factor by Borrow Ratio

This table shows your starting health factor based on how much you borrow:

| Deposit | Borrow | Borrow Ratio | Starting Health Factor | Safety Rating |
|---|---|---|---|---|
| 10 STX | 2 STX | 20% | 500% | Excellent |
| 10 STX | 3.33 STX | 33% | 300% | Very Safe |
| 10 STX | 5 STX | 50% | 200% | Safe |
| 10 STX | 6 STX | 60% | 166.7% | Moderate |
| 10 STX | 6.67 STX | 66.67% | 150% | Risky (minimum) |

**Recommendation:** Target a starting health factor of at least 200% (50% borrow ratio) to leave room for interest accrual.

---

## Monitoring Strategies

### Strategy 1: Dashboard Monitoring

The BitFlow dashboard shows your health factor in real-time on the Health Monitor card:

- **Green indicator:** You're safe (> 150%)
- **Amber indicator:** You should pay attention (110%–150%)
- **Red indicator:** Immediate action required (< 110%)

### Strategy 2: Direct Contract Query

For programmatic monitoring, call the read-only function:

```typescript
import { callReadOnlyFunction, uintCV, principalCV } from '@stacks/transactions';

const healthFactor = await callReadOnlyFunction({
  contractAddress: 'SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193',
  contractName: 'bitflow-vault-core',
  functionName: 'calculate-health-factor',
  functionArgs: [
    principalCV('SP...YOUR_ADDRESS'),
    uintCV(1000000) // STX price in micro units
  ],
  senderAddress: 'SP...YOUR_ADDRESS',
  network: 'mainnet',
});
```

### Strategy 3: Monitoring Schedule

| Health Factor | Check Frequency | Rationale |
|---|---|---|
| > 200% | Weekly | Large buffer, slow decline |
| 150–200% | Every 2–3 days | Moderate buffer |
| 130–150% | Daily | Warning zone, act soon |
| 110–130% | Every few hours | Near liquidation |
| < 110% | **Act immediately** | Liquidatable now |

### Strategy 4: Set Personal Alerts

While BitFlow doesn't have built-in alerts (planned for Phase 3), you can:

1. Set calendar reminders to check your health factor
2. Write a simple script that queries the contract and sends a notification
3. Use a blockchain monitoring service that watches your address

---

## Improving Your Health Factor

### Option 1: Deposit More Collateral

Adding more STX to your deposit directly increases your health factor.

**Before:** Deposit 15 STX, Debt 10 STX → Health = 150%
**Action:** Deposit 5 more STX
**After:** Deposit 20 STX, Debt 10 STX → Health = 200%

Each additional STX deposited raises your health factor proportionally.

### Option 2: Repay Your Loan

Repaying eliminates your debt entirely (BitFlow doesn't support partial repayment in v1):

**Before:** Deposit 15 STX, Debt 10.5 STX → Health = 142.9%
**Action:** Repay (10.5 STX + interest)
**After:** Deposit 15 STX, Debt 0 → No loan, infinite health factor

### Which Is Better?

| Situation | Best Action | Why |
|---|---|---|
| Health > 130% | Add collateral | Buys time without closing position |
| Health 110–130% | Repay if possible | Eliminates risk entirely |
| Health < 110% | Repay immediately | You're already liquidatable |
| Have STX in wallet | Either works | Choose based on preference |
| No STX in wallet | Buy/transfer STX, then repay | Urgent action needed |

---

## Related Documentation

- [Liquidation Guide](LIQUIDATION_GUIDE.md) — What happens at liquidation
- [Interest Calculator](INTEREST_CALCULATOR.md) — How interest affects your health
- [Quick Start Guide](QUICKSTART.md) — Getting started with BitFlow
- [Safety Best Practices](SAFETY.md) — Keep your funds safe
- [FAQ](FAQ.md) — Frequently asked questions
