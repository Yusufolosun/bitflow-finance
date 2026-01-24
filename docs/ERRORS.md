# Error Codes Reference

This document provides comprehensive documentation for all error codes used in the `vault-core` contract, including when they occur, how to prevent them, and how to handle them in your application.

## Error Code Summary

| Code | Constant | Function(s) | Severity |
|------|----------|-------------|----------|
| u100 | `ERR-OWNER-ONLY` | *(Reserved)* | High |
| u101 | `ERR-INSUFFICIENT-BALANCE` | withdraw | Medium |
| u102 | `ERR-INVALID-AMOUNT` | deposit | Low |
| u103 | `ERR-ALREADY-HAS-LOAN` | borrow | Medium |
| u104 | `ERR-LOAN-NOT-FOUND` | *(Unused)* | N/A |
| u105 | `ERR-INSUFFICIENT-COLLATERAL` | borrow | Medium |
| u106 | `ERR-NO-ACTIVE-LOAN` | repay | Medium |
| u107 | `ERR-NOT-LIQUIDATABLE` | liquidate | Medium |
| u108 | `ERR-LIQUIDATE-OWN-LOAN` | liquidate | High |

---

## Error Codes Detail

### u100: ERR-OWNER-ONLY

**Status:** Reserved (not currently implemented)

**Description:** 
This error code is reserved for future use when owner-only functions are added to the contract (e.g., pausing the contract, updating parameters, or administrative functions).

**When It Occurs:**
- Currently not in use
- Would trigger when a non-owner attempts to call an owner-restricted function

**Prevention:**
- Check if caller is the contract owner before calling admin functions
- Implement role-based access control in frontend

**Example (Future Use):**
```clarity
;; Future implementation
(define-public (pause-contract)
  (begin
    (asserts! (is-eq tx-sender contract-owner) ERR-OWNER-ONLY)
    ;; pause logic
  )
)
```

**Frontend Handling:**
```typescript
// Not currently needed, but would look like:
if (userAddress !== contractOwner) {
  throw new Error('Only contract owner can perform this action');
}
```

---

### u101: ERR-INSUFFICIENT-BALANCE

**Constant:** `ERR-INSUFFICIENT-BALANCE`

**Function:** `withdraw`

**Description:**
User attempted to withdraw more STX than they have deposited in the vault.

**When It Occurs:**
```clarity
(contract-call? .vault-core withdraw u2000)
;; Returns: (err u101) if user only has u1000 deposited
```

**Trigger Condition:**
```clarity
;; In withdraw function:
(asserts! (>= user-balance amount) ERR-INSUFFICIENT-BALANCE)
```

**Common Causes:**
1. User tries to withdraw more than deposited
2. User has deposits but they're locked as collateral for a loan
3. Arithmetic error in withdrawal amount calculation
4. Concurrent transactions causing race condition

**Prevention:**

**Pre-flight Check:**
```typescript
async function canWithdraw(userAddress: string, amount: number): Promise<boolean> {
  const deposit = await getUserDeposit(userAddress);
  return deposit >= amount;
}

// Before withdrawal
if (!await canWithdraw(userAddress, withdrawAmount)) {
  throw new Error(`Insufficient balance. You have ${deposit} STX but tried to withdraw ${withdrawAmount} STX`);
}
```

**Safe Withdrawal:**
```typescript
const maxWithdrawable = await getUserDeposit(userAddress);
const loan = await getUserLoan(userAddress);

// If user has a loan, collateral is locked
if (loan !== null) {
  const requiredCollateral = await calculateRequiredCollateral(loan.amount);
  const availableToWithdraw = maxWithdrawable - requiredCollateral;
  
  if (withdrawAmount > availableToWithdraw) {
    throw new Error(`Cannot withdraw collateral backing active loan. Available: ${availableToWithdraw} STX`);
  }
}
```

**Frontend Handling:**
```typescript
try {
  await contractCall('withdraw', [uintCV(amount)]);
} catch (error) {
  if (error.value === 101) {
    showError('Insufficient balance. Please reduce withdrawal amount.');
    // Suggest maximum withdrawable amount
    const maxAmount = await getUserDeposit(userAddress);
    showSuggestion(`Maximum you can withdraw: ${maxAmount} STX`);
  }
}
```

**Recovery:**
- Reduce withdrawal amount to available balance
- Check if collateral is locked by active loan
- Repay loan first if trying to access collateral

---

### u102: ERR-INVALID-AMOUNT

**Constant:** `ERR-INVALID-AMOUNT`

**Function:** `deposit`

**Description:**
User attempted to deposit zero or negative amount of STX.

**When It Occurs:**
```clarity
(contract-call? .vault-core deposit u0)
;; Returns: (err u102)
```

**Trigger Condition:**
```clarity
;; In deposit function:
(asserts! (> amount u0) ERR-INVALID-AMOUNT)
```

**Common Causes:**
1. Form submitted with empty or zero value
2. Input validation bug in frontend
3. Integer underflow in amount calculation
4. User intentionally submitting invalid transaction

**Prevention:**

**Input Validation:**
```typescript
function validateDepositAmount(amount: number): void {
  if (!amount || amount <= 0) {
    throw new Error('Deposit amount must be greater than zero');
  }
  
  if (!Number.isInteger(amount)) {
    throw new Error('Deposit amount must be a whole number');
  }
  
  if (amount > Number.MAX_SAFE_INTEGER) {
    throw new Error('Deposit amount too large');
  }
}

// Before transaction
validateDepositAmount(depositAmount);
```

**Form Validation:**
```typescript
// In React form
<input 
  type="number"
  min="1"
  step="1"
  value={amount}
  onChange={(e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setAmount(value);
    }
  }}
/>

<button 
  disabled={!amount || amount <= 0}
  onClick={handleDeposit}
>
  Deposit
</button>
```

**Frontend Handling:**
```typescript
try {
  if (amount <= 0) {
    throw new Error('Please enter a valid deposit amount');
  }
  await contractCall('deposit', [uintCV(amount)]);
} catch (error) {
  if (error.value === 102) {
    showError('Invalid amount. Please enter a positive number.');
    clearInput();
  }
}
```

**Recovery:**
- Prompt user to enter valid amount (> 0)
- Reset form to default values
- Provide example of valid amount

---

### u103: ERR-ALREADY-HAS-LOAN

**Constant:** `ERR-ALREADY-HAS-LOAN`

**Function:** `borrow`

**Description:**
User attempted to borrow STX while already having an active loan. The contract only allows one loan per user at a time.

**When It Occurs:**
```clarity
;; User already has a loan
(contract-call? .vault-core borrow u500 u5 u30)
;; Returns: (err u103)
```

**Trigger Condition:**
```clarity
;; In borrow function:
(asserts! (is-none (map-get? user-loans tx-sender)) ERR-ALREADY-HAS-LOAN)
```

**Common Causes:**
1. User tries to take second loan without repaying first
2. Frontend doesn't check for existing loan before showing borrow UI
3. Race condition if repayment and new borrow happen simultaneously
4. User refreshes page and submits borrow request twice

**Prevention:**

**Pre-flight Check:**
```typescript
async function hasActiveLoan(userAddress: string): Promise<boolean> {
  const loan = await getUserLoan(userAddress);
  return loan !== null;
}

// Before showing borrow form
const activeLoan = await hasActiveLoan(userAddress);
if (activeLoan) {
  showWarning('You already have an active loan. Please repay it before borrowing again.');
  disableBorrowButton();
}
```

**Smart UI State:**
```typescript
interface UserState {
  canBorrow: boolean;
  activeLoan: Loan | null;
  reason?: string;
}

async function checkBorrowEligibility(userAddress: string): Promise<UserState> {
  const loan = await getUserLoan(userAddress);
  
  if (loan !== null) {
    return {
      canBorrow: false,
      activeLoan: loan,
      reason: 'You already have an active loan'
    };
  }
  
  return {
    canBorrow: true,
    activeLoan: null
  };
}

// In UI
const { canBorrow, activeLoan, reason } = await checkBorrowEligibility(address);

if (!canBorrow) {
  return (
    <div>
      <p>{reason}</p>
      <RepayButton loan={activeLoan} />
    </div>
  );
}

return <BorrowForm />;
```

**Frontend Handling:**
```typescript
try {
  await contractCall('borrow', [
    uintCV(amount),
    uintCV(interestRate),
    uintCV(termDays)
  ]);
} catch (error) {
  if (error.value === 103) {
    showError('You already have an active loan. Please repay it first.');
    
    // Show repayment info
    const repaymentAmount = await getRepaymentAmount(userAddress);
    showModal({
      title: 'Active Loan Found',
      message: `You need to repay ${repaymentAmount.total} STX to take a new loan.`,
      action: 'Go to Repayment',
      onAction: () => navigate('/repay')
    });
  }
}
```

**Recovery:**
1. Display current loan details
2. Show repayment amount
3. Redirect to repayment page
4. After repayment completes, allow new borrow

**Workflow Example:**
```typescript
// Complete workflow
async function handleBorrowRequest(amount: number, rate: number, term: number) {
  // Check for existing loan
  const existingLoan = await getUserLoan(userAddress);
  
  if (existingLoan) {
    const repayment = await getRepaymentAmount(userAddress);
    
    const confirmed = await showConfirmDialog({
      title: 'Active Loan Detected',
      message: `You have an active loan of ${existingLoan.amount} STX. 
                Would you like to repay it first?`,
      repaymentAmount: repayment.total,
      actions: ['Repay Now', 'Cancel']
    });
    
    if (confirmed) {
      await repayLoan();
      // After repayment, proceed with new borrow
      await borrow(amount, rate, term);
    }
  } else {
    await borrow(amount, rate, term);
  }
}
```

---

### u104: ERR-LOAN-NOT-FOUND

**Constant:** `ERR-LOAN-NOT-FOUND`

**Status:** Defined but not currently used in contract

**Description:**
This error code is defined in the contract but not actively used in any function. It may have been intended for future use or removed from active use.

**Note:**
The contract uses `ERR-NO-ACTIVE-LOAN` (u106) instead for loan-related checks. This error code is reserved and may be used in future contract updates.

---

### u105: ERR-INSUFFICIENT-COLLATERAL

**Constant:** `ERR-INSUFFICIENT-COLLATERAL`

**Function:** `borrow`

**Description:**
User attempted to borrow an amount that exceeds their collateral capacity. The contract requires 150% collateralization.

**When It Occurs:**
```clarity
;; User has 1000 STX deposited, tries to borrow 1000 STX
;; Required collateral: 1500 STX (150% of 1000)
(contract-call? .vault-core borrow u1000 u10 u30)
;; Returns: (err u105)
```

**Trigger Condition:**
```clarity
;; In borrow function:
(asserts! (>= user-balance required-collateral) ERR-INSUFFICIENT-COLLATERAL)

;; Where required-collateral = (borrow-amount × 150) / 100
```

**Common Causes:**
1. User tries to borrow more than 66.67% of their deposit
2. Insufficient deposits in the vault
3. Miscalculation of maximum borrowing capacity
4. User doesn't understand collateralization requirements

**Collateralization Math:**
```
Required Collateral = Borrow Amount × 150%
Maximum Borrow = Deposit ÷ 1.5

Examples:
- Deposit 1500 STX → Max borrow 1000 STX
- Deposit 3000 STX → Max borrow 2000 STX
- Deposit 750 STX → Max borrow 500 STX
```

**Prevention:**

**Calculate Max Borrow:**
```typescript
function calculateMaxBorrow(depositAmount: number): number {
  return Math.floor(depositAmount / 1.5);
}

function calculateRequiredDeposit(borrowAmount: number): number {
  return Math.ceil(borrowAmount * 1.5);
}

// Examples
const deposit = 1500;
const maxBorrow = calculateMaxBorrow(1500); // 1000 STX

const wantToBorrow = 2000;
const needToDeposit = calculateRequiredDeposit(2000); // 3000 STX
```

**Pre-flight Validation:**
```typescript
async function validateBorrowRequest(
  userAddress: string,
  borrowAmount: number
): Promise<{ valid: boolean; reason?: string; required?: number }> {
  const deposit = await getUserDeposit(userAddress);
  const requiredCollateral = borrowAmount * 1.5;
  
  if (deposit < requiredCollateral) {
    return {
      valid: false,
      reason: 'Insufficient collateral',
      required: requiredCollateral
    };
  }
  
  return { valid: true };
}

// Usage
const validation = await validateBorrowRequest(address, 1000);
if (!validation.valid) {
  showError(`You need ${validation.required} STX collateral to borrow 1000 STX. 
             Current deposit: ${deposit} STX. 
             Please deposit ${validation.required - deposit} more STX.`);
}
```

**Dynamic Borrow Limit UI:**
```typescript
function BorrowForm() {
  const [deposit, setDeposit] = useState(0);
  const [borrowAmount, setBorrowAmount] = useState(0);
  
  const maxBorrow = calculateMaxBorrow(deposit);
  const requiredCollateral = calculateRequiredDeposit(borrowAmount);
  const collateralRatio = (deposit / borrowAmount) * 100;
  
  useEffect(() => {
    loadUserDeposit().then(setDeposit);
  }, []);
  
  return (
    <div>
      <p>Your Deposit: {deposit} STX</p>
      <p>Max Borrow: {maxBorrow} STX</p>
      
      <input
        type="range"
        min="0"
        max={maxBorrow}
        value={borrowAmount}
        onChange={(e) => setBorrowAmount(parseInt(e.target.value))}
      />
      
      <p>Borrow Amount: {borrowAmount} STX</p>
      <p>Collateral Ratio: {collateralRatio.toFixed(0)}%</p>
      
      {borrowAmount > maxBorrow && (
        <Warning>
          Insufficient collateral. You need {requiredCollateral} STX 
          but have {deposit} STX.
          <br />
          <button onClick={() => navigate('/deposit')}>
            Deposit {requiredCollateral - deposit} more STX
          </button>
        </Warning>
      )}
      
      <button 
        disabled={borrowAmount > maxBorrow || borrowAmount === 0}
        onClick={handleBorrow}
      >
        Borrow
      </button>
    </div>
  );
}
```

**Frontend Handling:**
```typescript
try {
  await contractCall('borrow', [
    uintCV(amount),
    uintCV(interestRate),
    uintCV(termDays)
  ]);
} catch (error) {
  if (error.value === 105) {
    const deposit = await getUserDeposit(userAddress);
    const required = amount * 1.5;
    const shortfall = required - deposit;
    
    showError({
      title: 'Insufficient Collateral',
      message: `You need ${required} STX to borrow ${amount} STX (150% collateralization).
                Current deposit: ${deposit} STX.
                Shortfall: ${shortfall} STX`,
      actions: [
        {
          label: `Deposit ${shortfall} STX`,
          onClick: () => navigate('/deposit', { amount: shortfall })
        },
        {
          label: `Borrow ${calculateMaxBorrow(deposit)} STX instead`,
          onClick: () => setBorrowAmount(calculateMaxBorrow(deposit))
        }
      ]
    });
  }
}
```

**Recovery Options:**
1. **Increase Deposit:** Deposit more STX to meet collateral requirement
2. **Reduce Borrow Amount:** Lower requested amount to fit current collateral
3. **Calculate Exact Need:** Show user exactly how much more to deposit

```typescript
async function handleInsufficientCollateral(
  userAddress: string,
  requestedAmount: number
) {
  const currentDeposit = await getUserDeposit(userAddress);
  const requiredDeposit = requestedAmount * 1.5;
  const maxBorrowable = Math.floor(currentDeposit / 1.5);
  
  return {
    option1: {
      action: 'deposit-more',
      amount: requiredDeposit - currentDeposit,
      description: `Deposit ${requiredDeposit - currentDeposit} more STX`
    },
    option2: {
      action: 'borrow-less',
      amount: maxBorrowable,
      description: `Borrow ${maxBorrowable} STX instead of ${requestedAmount} STX`
    }
  };
}
```

---

### u106: ERR-NO-ACTIVE-LOAN

**Constant:** `ERR-NO-ACTIVE-LOAN`

**Function:** `repay`, `liquidate`

**Description:**
User attempted to repay or liquidate a loan that doesn't exist.

**When It Occurs:**
```clarity
;; User has no loan, tries to repay
(contract-call? .vault-core repay)
;; Returns: (err u106)

;; Liquidator tries to liquidate user with no loan
(contract-call? .vault-core liquidate 'ST1... u100)
;; Returns: (err u106)
```

**Trigger Condition:**
```clarity
;; In repay and liquidate functions:
(let (
  (loan (unwrap! (map-get? user-loans tx-sender) ERR-NO-ACTIVE-LOAN))
)
  ;; ... function body
)
```

**Common Causes:**
1. User already repaid their loan
2. User never took a loan
3. Frontend shows repay button to users without loans
4. Concurrent repayment completed before second attempt
5. Liquidator targeting wrong address

**Prevention:**

**Pre-flight Check:**
```typescript
async function canRepay(userAddress: string): Promise<boolean> {
  const loan = await getUserLoan(userAddress);
  return loan !== null;
}

// Before showing repay UI
if (!await canRepay(userAddress)) {
  hideRepayButton();
  showMessage('You have no active loan to repay');
}
```

**UI State Management:**
```typescript
interface RepaymentState {
  hasLoan: boolean;
  repaymentAmount?: {
    principal: number;
    interest: number;
    total: number;
  };
}

async function getRepaymentState(userAddress: string): Promise<RepaymentState> {
  const loan = await getUserLoan(userAddress);
  
  if (!loan) {
    return { hasLoan: false };
  }
  
  const repaymentAmount = await getRepaymentAmount(userAddress);
  
  return {
    hasLoan: true,
    repaymentAmount
  };
}

// In component
const { hasLoan, repaymentAmount } = await getRepaymentState(address);

if (!hasLoan) {
  return <NoActiveLoanMessage />;
}

return <RepaymentForm amount={repaymentAmount} />;
```

**For Liquidations:**
```typescript
async function validateLiquidationTarget(
  borrowerAddress: string,
  stxPrice: number
): Promise<{ valid: boolean; reason?: string }> {
  const loan = await getUserLoan(borrowerAddress);
  
  if (!loan) {
    return {
      valid: false,
      reason: 'Target has no active loan'
    };
  }
  
  const isLiquidatable = await checkLiquidatable(borrowerAddress, stxPrice);
  
  if (!isLiquidatable) {
    return {
      valid: false,
      reason: 'Position is not liquidatable (health factor ≥ 110%)'
    };
  }
  
  return { valid: true };
}
```

**Frontend Handling:**
```typescript
// For repayment
try {
  await contractCall('repay', []);
} catch (error) {
  if (error.value === 106) {
    showInfo({
      title: 'No Active Loan',
      message: 'You don\'t have any active loan to repay.',
      action: 'Go to Borrow',
      onAction: () => navigate('/borrow')
    });
  }
}

// For liquidation
try {
  await contractCall('liquidate', [
    principalCV(borrowerAddress),
    uintCV(stxPrice)
  ]);
} catch (error) {
  if (error.value === 106) {
    showError('Target address has no active loan to liquidate.');
    // Remove from liquidation opportunities list
    removeFromList(borrowerAddress);
  }
}
```

**Recovery:**
- **For Repayment:** Redirect to borrow page or dashboard
- **For Liquidation:** Move to next liquidation target
- **Prevent Future:** Cache loan state and update after successful transactions

---

### u107: ERR-NOT-LIQUIDATABLE

**Constant:** `ERR-NOT-LIQUIDATABLE`

**Function:** `liquidate`

**Description:**
Position has a health factor ≥ 110% and cannot be liquidated. The position is healthy or in warning zone but not yet eligible for liquidation.

**When It Occurs:**
```clarity
;; User has 1500 STX collateral, 1000 STX loan, price is $1.00
;; Health factor: 150% (healthy)
(contract-call? .vault-core liquidate 'ST1... u100)
;; Returns: (err u107)
```

**Trigger Condition:**
```clarity
;; In liquidate function:
(asserts! (is-liquidatable borrower stx-price) ERR-NOT-LIQUIDATABLE)

;; Where is-liquidatable returns true only if health-factor < 110%
```

**Liquidation Threshold:**
```
Health Factor = (Collateral × STX Price / 100) × 100 / Loan Amount

Liquidatable when: Health Factor < 110%
```

**Common Causes:**
1. STX price increased, improving health factor
2. Wrong price data used for liquidation check
3. Someone else added collateral to the position
4. Timing issue - position was liquidatable but recovered
5. Liquidation bot using stale price data

**Prevention:**

**Pre-liquidation Verification:**
```typescript
async function shouldLiquidate(
  borrowerAddress: string,
  currentStxPrice: number
): Promise<{
  liquidatable: boolean;
  healthFactor?: number;
  reason?: string;
}> {
  const healthFactor = await calculateHealthFactor(borrowerAddress, currentStxPrice);
  
  if (!healthFactor) {
    return {
      liquidatable: false,
      reason: 'No active loan'
    };
  }
  
  if (healthFactor >= 110) {
    return {
      liquidatable: false,
      healthFactor,
      reason: `Health factor ${healthFactor}% is above liquidation threshold (110%)`
    };
  }
  
  return {
    liquidatable: true,
    healthFactor
  };
}

// Before liquidation
const check = await shouldLiquidate(target, stxPrice);
if (!check.liquidatable) {
  console.log(`Cannot liquidate: ${check.reason}`);
  return;
}
```

**Real-time Price Monitoring:**
```typescript
class LiquidationBot {
  private priceOracle: PriceOracle;
  private positions: Map<string, Position>;
  
  async scanForLiquidations(currentPrice: number): Promise<string[]> {
    const liquidatablePositions: string[] = [];
    
    for (const [address, position] of this.positions) {
      const healthFactor = await calculateHealthFactor(address, currentPrice);
      
      if (healthFactor && healthFactor < 110) {
        // Double-check before adding
        const isLiquidatable = await checkIsLiquidatable(address, currentPrice);
        
        if (isLiquidatable) {
          liquidatablePositions.push(address);
        } else {
          console.warn(`Health factor ${healthFactor}% but not liquidatable for ${address}`);
        }
      }
    }
    
    return liquidatablePositions;
  }
  
  async attemptLiquidation(borrowerAddress: string, stxPrice: number) {
    // Final check before transaction
    const finalCheck = await checkIsLiquidatable(borrowerAddress, stxPrice);
    
    if (!finalCheck) {
      console.log(`Position recovered before liquidation: ${borrowerAddress}`);
      return { success: false, reason: 'Position no longer liquidatable' };
    }
    
    try {
      const result = await liquidate(borrowerAddress, stxPrice);
      return { success: true, result };
    } catch (error) {
      if (error.value === 107) {
        console.log(`Race condition: Position liquidated or recovered`);
        return { success: false, reason: 'Not liquidatable' };
      }
      throw error;
    }
  }
}
```

**Frontend Handling:**
```typescript
try {
  await contractCall('liquidate', [
    principalCV(borrowerAddress),
    uintCV(stxPrice)
  ]);
} catch (error) {
  if (error.value === 107) {
    const healthFactor = await calculateHealthFactor(borrowerAddress, stxPrice);
    
    showWarning({
      title: 'Liquidation Failed',
      message: `Position is not liquidatable. 
                Current health factor: ${healthFactor}%
                Liquidation threshold: < 110%
                
                The position may have recovered or been liquidated by another user.`,
    });
    
    // Update UI - remove from liquidation opportunities
    removeFromLiquidationList(borrowerAddress);
  }
}
```

**Recovery:**
- Update liquidation opportunities list
- Re-fetch current health factor
- Monitor for future liquidation opportunity
- Use on-chain `is-liquidatable` check before attempting

**Best Practices for Liquidation Bots:**
```typescript
// Always use double-check pattern
async function safeLiquidate(borrower: string, price: number) {
  // 1. Read-only check (free)
  const isLiquidatable = await checkIsLiquidatable(borrower, price);
  if (!isLiquidatable) return null;
  
  // 2. Calculate profitability
  const loan = await getUserLoan(borrower);
  const deposit = await getUserDeposit(borrower);
  const bonus = loan.amount * 0.05;
  const profit = deposit - loan.amount - bonus;
  
  if (profit <= 0) {
    console.log('Liquidation not profitable');
    return null;
  }
  
  // 3. Final on-chain check and execute
  try {
    return await liquidate(borrower, price);
  } catch (error) {
    if (error.value === 107) {
      console.log('Position recovered during transaction');
      return null;
    }
    throw error;
  }
}
```

---

### u108: ERR-LIQUIDATE-OWN-LOAN

**Constant:** `ERR-LIQUIDATE-OWN-LOAN`

**Function:** `liquidate`

**Description:**
User attempted to liquidate their own loan position. Self-liquidation is not allowed to prevent abuse.

**When It Occurs:**
```clarity
;; User tries to liquidate their own position
(contract-call? .vault-core liquidate tx-sender u70)
;; Returns: (err u108)
```

**Trigger Condition:**
```clarity
;; In liquidate function:
(asserts! (not (is-eq tx-sender borrower)) ERR-LIQUIDATE-OWN-LOAN)
```

**Why Self-Liquidation is Blocked:**
1. **Prevents Gaming:** Users could trigger liquidations to get the 5% bonus unfairly
2. **Economic Abuse:** User could deposit, borrow, liquidate self for instant profit
3. **Protocol Integrity:** Liquidations should be third-party market actions
4. **Fair Competition:** Ensures liquidation opportunities are available to all

**Attack Scenario (If Allowed):**
```
1. User deposits 1500 STX
2. User borrows 1000 STX at low price
3. Price drops making position liquidatable
4. User self-liquidates:
   - Receives back 1500 STX collateral
   - Pays 1050 STX (1000 + 50 bonus)
   - Net: Still has the borrowed 1000 STX minus the 50 bonus
   - Unfair advantage over legitimate liquidators
```

**Prevention:**

**Frontend Check:**
```typescript
async function validateLiquidator(
  liquidatorAddress: string,
  borrowerAddress: string
): Promise<{ valid: boolean; reason?: string }> {
  if (liquidatorAddress === borrowerAddress) {
    return {
      valid: false,
      reason: 'You cannot liquidate your own position'
    };
  }
  
  return { valid: true };
}

// Before liquidation
const validation = await validateLiquidator(userAddress, targetAddress);
if (!validation.valid) {
  throw new Error(validation.reason);
}
```

**UI Prevention:**
```typescript
function LiquidationList({ userAddress }: { userAddress: string }) {
  const [positions, setPositions] = useState<Position[]>([]);
  
  useEffect(() => {
    loadLiquidatablePositions().then(positions => {
      // Filter out user's own position
      const filtered = positions.filter(p => p.borrower !== userAddress);
      setPositions(filtered);
    });
  }, [userAddress]);
  
  return (
    <div>
      {positions.length === 0 && <p>No liquidation opportunities available</p>}
      {positions.map(position => (
        <LiquidationCard
          key={position.borrower}
          position={position}
          onLiquidate={() => liquidate(position.borrower, currentPrice)}
        />
      ))}
    </div>
  );
}
```

**Alternative Actions for Users:**
```typescript
// If user has unhealthy position, suggest repayment instead
async function handleUnhealthyPosition(
  userAddress: string,
  stxPrice: number
) {
  const isLiquidatable = await checkIsLiquidatable(userAddress, stxPrice);
  
  if (isLiquidatable) {
    const repaymentAmount = await getRepaymentAmount(userAddress);
    
    showAlert({
      severity: 'danger',
      title: 'Your Position is Liquidatable!',
      message: `Your health factor is below 110%. 
                You risk being liquidated by other users.
                
                Repayment amount: ${repaymentAmount.total} STX
                
                Actions you can take:
                1. Repay your loan (${repaymentAmount.total} STX)
                2. Deposit more collateral
                3. Wait for price recovery (risky)`,
      actions: [
        {
          label: 'Repay Now',
          onClick: () => repayLoan()
        },
        {
          label: 'Add Collateral',
          onClick: () => navigate('/deposit')
        }
      ]
    });
  }
}
```

**Frontend Handling:**
```typescript
try {
  await contractCall('liquidate', [
    principalCV(borrowerAddress),
    uintCV(stxPrice)
  ]);
} catch (error) {
  if (error.value === 108) {
    showError({
      title: 'Self-Liquidation Not Allowed',
      message: `You cannot liquidate your own position.
                
                If your position is unhealthy, you can:
                • Repay your loan
                • Add more collateral
                • Wait for price recovery`,
      actions: [
        {
          label: 'View My Position',
          onClick: () => navigate('/my-loans')
        },
        {
          label: 'Repay Loan',
          onClick: () => navigate('/repay')
        }
      ]
    });
  }
}
```

**For Liquidation Bots:**
```typescript
class LiquidationMonitor {
  private botAddress: string;
  
  async findLiquidationOpportunities(stxPrice: number): Promise<string[]> {
    const allPositions = await getAllPositionsWithLoans();
    const opportunities: string[] = [];
    
    for (const position of allPositions) {
      // Skip own position
      if (position.borrower === this.botAddress) {
        continue;
      }
      
      const isLiquidatable = await checkIsLiquidatable(
        position.borrower,
        stxPrice
      );
      
      if (isLiquidatable) {
        opportunities.push(position.borrower);
      }
    }
    
    return opportunities;
  }
}
```

---

## Error Handling Best Practices

### 1. Pre-flight Validation

Always validate before submitting transactions:

```typescript
async function safeContractCall(
  functionName: string,
  args: any[]
): Promise<any> {
  // Run all validations
  const validations = await runValidations(functionName, args);
  
  if (!validations.passed) {
    throw new Error(validations.errors.join(', '));
  }
  
  // Execute transaction
  try {
    return await contractCall(functionName, args);
  } catch (error) {
    handleContractError(error);
  }
}
```

### 2. User-Friendly Error Messages

Map error codes to helpful messages:

```typescript
const ERROR_MESSAGES = {
  101: {
    title: 'Insufficient Balance',
    message: 'You don\'t have enough deposited to withdraw this amount.',
    action: 'Reduce withdrawal amount'
  },
  102: {
    title: 'Invalid Amount',
    message: 'Please enter a valid amount greater than zero.',
    action: 'Enter valid amount'
  },
  103: {
    title: 'Active Loan Exists',
    message: 'You already have an active loan. Repay it before borrowing again.',
    action: 'View active loan'
  },
  105: {
    title: 'Insufficient Collateral',
    message: 'You need to deposit more STX to borrow this amount.',
    action: 'Deposit more or borrow less'
  },
  106: {
    title: 'No Active Loan',
    message: 'You don\'t have an active loan to repay.',
    action: 'Go to borrow'
  },
  107: {
    title: 'Position Not Liquidatable',
    message: 'This position is healthy and cannot be liquidated.',
    action: 'Check other opportunities'
  },
  108: {
    title: 'Self-Liquidation Not Allowed',
    message: 'You cannot liquidate your own position.',
    action: 'View your loan details'
  }
};

function handleContractError(error: any) {
  const errorCode = error.value;
  const errorInfo = ERROR_MESSAGES[errorCode];
  
  if (errorInfo) {
    showError(errorInfo);
  } else {
    showError({
      title: 'Transaction Failed',
      message: `Error code: ${errorCode}`,
      action: 'Try again'
    });
  }
}
```

### 3. Optimistic UI Updates

Update UI optimistically but handle rollback:

```typescript
async function optimisticRepay() {
  const originalLoan = currentLoan;
  
  // Optimistic update
  setCurrentLoan(null);
  showSuccess('Repayment in progress...');
  
  try {
    await contractCall('repay', []);
    showSuccess('Loan repaid successfully!');
  } catch (error) {
    // Rollback on error
    setCurrentLoan(originalLoan);
    handleContractError(error);
  }
}
```

### 4. Error Recovery Workflows

Provide clear next steps:

```typescript
function ErrorRecoveryModal({ error, onClose }: Props) {
  const recovery = getRecoveryOptions(error);
  
  return (
    <Modal>
      <h2>{recovery.title}</h2>
      <p>{recovery.message}</p>
      
      <div>
        {recovery.options.map(option => (
          <button key={option.id} onClick={option.action}>
            {option.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
```

---

## Testing Error Scenarios

Example test cases for each error:

```typescript
describe('Error Handling', () => {
  it('should return u101 when withdrawing too much', async () => {
    await deposit(1000);
    const result = await withdraw(2000);
    expect(result).toBeErr(101);
  });
  
  it('should return u102 when depositing zero', async () => {
    const result = await deposit(0);
    expect(result).toBeErr(102);
  });
  
  it('should return u103 when borrowing with existing loan', async () => {
    await deposit(3000);
    await borrow(1000, 10, 30);
    const result = await borrow(500, 10, 30);
    expect(result).toBeErr(103);
  });
  
  it('should return u105 with insufficient collateral', async () => {
    await deposit(1000);
    const result = await borrow(1000, 10, 30);
    expect(result).toBeErr(105);
  });
  
  it('should return u106 when repaying without loan', async () => {
    const result = await repay();
    expect(result).toBeErr(106);
  });
  
  it('should return u107 when liquidating healthy position', async () => {
    await setupHealthyLoan();
    const result = await liquidate(borrower, 100);
    expect(result).toBeErr(107);
  });
  
  it('should return u108 when self-liquidating', async () => {
    await setupLiquidatableLoan();
    const result = await liquidate(tx-sender, 70);
    expect(result).toBeErr(108);
  });
});
```

---

## Summary

| Error | Prevention | Recovery |
|-------|-----------|----------|
| u101 | Check balance before withdrawal | Reduce amount or repay loan |
| u102 | Validate input > 0 | Re-enter valid amount |
| u103 | Check for existing loan | Repay first, then borrow |
| u105 | Calculate max borrow capacity | Deposit more or reduce amount |
| u106 | Check loan exists | Navigate to borrow page |
| u107 | Verify health factor < 110% | Find other opportunities |
| u108 | Filter out own position | Use repay instead |

---

For more information, see:
- [Contract Documentation](./CONTRACTS.md)
- [API Reference](./API.md)
- [Test Suite](../tests/vault-core.test.ts)
