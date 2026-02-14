# Liquidation Prevention Guide

> **Understand how liquidation works and how to prevent it.**

Liquidation is the most important risk to understand when borrowing on BitFlow Finance. This guide explains the mechanics, shows you how to avoid it, and what to do if it happens.

---

## What Is Liquidation?

Liquidation is a safety mechanism that protects the protocol when a loan becomes undercollateralized. When your **health factor drops below 110%**, any third-party user can liquidate your loan.

In simple terms: if your collateral is no longer worth enough to safely back your loan, someone else can pay off your debt and take your collateral as a reward.

---

## How Liquidation Works

### The Process

```
1. You have a loan with health factor < 110%

2. A liquidator calls: liquidate(your-address, stx-price)

3. Contract verifies:
   ├── Liquidator ≠ borrower (can't self-liquidate)
   ├── Borrower has an active loan
   └── Health factor < 110% at given price

4. Contract calculates:
   ├── Accrued interest
   ├── Total debt = principal + interest
   └── Liquidator bonus = 5% of total debt

5. Liquidator pays: total debt + 5% bonus → vault

6. Liquidator receives: ALL of borrower's collateral

7. Borrower's state is reset:
   ├── Loan is deleted
   └── Deposit is set to 0
```

### Key Parameters

| Parameter | Value | Meaning |
|---|---|---|
| Minimum collateral ratio | 150% | Required when borrowing |
| Liquidation threshold | 110% | Below this, liquidation is possible |
| Liquidator bonus | 5% | Bonus paid by liquidator on top of debt |
| Liquidation type | Full | Entire position is liquidated (no partial) |

---

## Health Factor Explained

Your health factor represents how safe your loan is:

```
                    collateral value
Health Factor = ─────────────────────── × 100
                     total debt
```

In the contract, this is calculated using STX price:

```clarity
(define-read-only (calculate-health-factor (user principal) (stx-price uint))
  ;; health = (deposit × stx-price × 100) / loan-amount
)
```

### Health Factor Zones

```
  ┌──────────────────────────────────────────────────────┐
  │                 HEALTH FACTOR ZONES                  │
  │                                                      │
  │  ◄─────── DANGER ────────┤                           │
  │  0%              110%    │                           │
  │  ████████████████████    │                           │
  │  [Liquidation possible]  │                           │
  │                          │                           │
  │                 110%─────┤──── WARNING ─────┤         │
  │                          │    110% - 150%   │         │
  │                          │    ▓▓▓▓▓▓▓▓▓▓    │         │
  │                          │    [Monitor!]    │         │
  │                          │                  │         │
  │                          │         150%─────┤── SAFE  │
  │                          │                  │  > 150% │
  │                          │                  │  ░░░░░  │
  │                          │                  │ [OK!]   │
  └──────────────────────────────────────────────────────┘
```

---

## Why Liquidation Happens

### Cause 1: Borrowing Too Much

If you borrow close to the maximum (66.67% of deposit), your health factor starts at exactly 150% — right at the edge of the warning zone. Any negative movement pushes you toward liquidation.

**Example:**
- Deposit: 15 STX
- Borrow: 10 STX (maximum allowed at 150%)
- Starting health factor: 150%
- After 30 days of interest at 5% APR: ~149.4%
- More interest accrual → slides toward 110%

### Cause 2: Interest Accrual

Interest on your loan increases your total debt over time, which gradually decreases your health factor — even if nothing else changes.

**Example (borrow 10 STX at 8% APR):**

| Time | Interest Accrued | Total Debt | Health Factor (15 STX deposit) |
|---|---|---|---|
| Day 0 | 0 STX | 10.00 STX | 150.0% |
| Day 30 | 0.066 STX | 10.066 STX | 149.0% |
| Day 90 | 0.197 STX | 10.197 STX | 147.1% |
| Day 180 | 0.395 STX | 10.395 STX | 144.3% |
| Day 365 | 0.800 STX | 10.800 STX | 138.9% |

### Cause 3: Oracle Price Movement (Future Risk)

In the current implementation, the liquidator provides the STX price. In future versions with oracle integration, price drops would directly reduce your health factor.

---

## How to Prevent Liquidation

### Strategy 1: Borrow Conservatively

The safest approach is to never borrow more than 50% of your deposit:

| Deposit | Max Borrow (66.67%) | Recommended Borrow (50%) | Health at Recommended |
|---|---|---|---|
| 10 STX | 6.67 STX | 5.00 STX | 200% |
| 20 STX | 13.33 STX | 10.00 STX | 200% |
| 50 STX | 33.33 STX | 25.00 STX | 200% |

At 50% borrow, your starting health factor is 200%, giving you a 90-percentage-point buffer before liquidation.

### Strategy 2: Add Collateral When Warning

If your health factor drops into the warning zone (110%–150%), deposit additional STX:

```
Before: Deposit 15 STX, Debt 10.5 STX → Health = 142.9%
Action: Deposit 5 more STX
After:  Deposit 20 STX, Debt 10.5 STX → Health = 190.5%
```

### Strategy 3: Repay Early

Don't wait until the due date. Repaying early reduces your debt and eliminates liquidation risk:

```
Before: Deposit 15 STX, Debt 10.5 STX → Health = 142.9%
Action: Repay loan (10.5 STX + interest)
After:  Deposit 15 STX, Debt 0 STX → No loan, no risk
```

### Strategy 4: Use Shorter Loan Terms

Shorter loans accrue less interest, keeping your health factor higher:

| Term | Interest at 5% APR on 10 STX | Health Impact |
|---|---|---|
| 7 days | 0.010 STX | Minimal |
| 30 days | 0.041 STX | Low |
| 90 days | 0.123 STX | Moderate |
| 365 days | 0.500 STX | Significant |

### Strategy 5: Monitor Regularly

Check your health factor on the dashboard:
- **Daily** if health factor is 150–200%
- **Multiple times per day** if health factor is 110–150%
- **Immediately act** if health factor drops below 130%

---

## Liquidation Economics

### For the Borrower (You)

When you get liquidated, here's what happens to your assets:

```
  BEFORE LIQUIDATION:
  ├── Wallet:    10 STX (originally borrowed)
  ├── Deposit:   15 STX (locked as collateral)
  └── Loan:      10 STX + interest (owed)

  AFTER LIQUIDATION:
  ├── Wallet:    10 STX (you keep borrowed amount)
  ├── Deposit:   0 STX  (seized by liquidator)
  └── Loan:      deleted (paid by liquidator)

  NET RESULT:
  ├── Lost:      15 STX (deposit/collateral)
  ├── Kept:      10 STX (borrowed amount)
  └── Net loss:  5 STX + interest
```

### For the Liquidator

Liquidators are incentivized by the 5% bonus:

```
  LIQUIDATOR PAYS:
  ├── Borrower's debt:  10.50 STX (principal + interest)
  └── 5% bonus:          0.53 STX
  ├── Total paid:       11.03 STX

  LIQUIDATOR RECEIVES:
  └── Borrower's collateral: 15.00 STX

  LIQUIDATOR PROFIT:
  └── 15.00 - 11.03 = 3.97 STX
```

---

## Recovery After Liquidation

If you've been liquidated, here's what to do:

### Step 1: Understand What Happened

1. Check the Stacks Explorer for the liquidation transaction
2. Verify that your deposit is now 0 and your loan is deleted
3. Note that the STX you originally borrowed is still in your wallet

### Step 2: Restart Safely

1. Deposit STX again (you can start fresh immediately)
2. This time, borrow more conservatively
3. Target a health factor of 200%+ at origination
4. Set up more frequent monitoring

### Step 3: Learn From It

| What Went Wrong | What To Do Next Time |
|---|---|---|
| Borrowed too much | Borrow ≤ 50% of deposit |
| Didn't monitor | Check health factor daily |
| Interest ate the buffer | Use shorter loan terms |
| No emergency plan | Keep reserve STX for repayment |

---

## Liquidation FAQ

**Q: Can I be partially liquidated?**
A: No. BitFlow v1.x liquidates the entire position — full loan deletion and full collateral seizure.

**Q: Can I liquidate myself?**
A: No. The contract enforces `ERR-LIQUIDATE-OWN-LOAN` (u108). Another address must perform the liquidation.

**Q: Who are the liquidators?**
A: Anyone with a Stacks wallet. Some run automated bots that monitor health factors.

**Q: Is there a warning before liquidation?**
A: The dashboard shows a yellow warning when your health drops below 150% and a red alert below 110%. There's no on-chain warning system.

**Q: Can I reverse a liquidation?**
A: No. Liquidation is a permanent, irreversible on-chain action.

**Q: What's the worst-case loss?**
A: Your full deposit minus the amount you borrowed. For example, deposit 15 STX, borrow 10 STX → worst case lose 5 STX + accrued interest.

---

## Related Documentation

- [Health Factor Guide](HEALTH_FACTOR_GUIDE.md) — Deep dive into health factors
- [Interest Calculator](INTEREST_CALCULATOR.md) — Calculate your interest costs
- [Safety Best Practices](SAFETY.md) — Protect your funds
- [Troubleshooting](TROUBLESHOOTING.md) — Fix common issues
- [FAQ](FAQ.md) — Frequently asked questions
