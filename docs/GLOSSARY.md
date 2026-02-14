# Glossary

Comprehensive definitions of terms used in BitFlow vault-core documentation and the broader DeFi ecosystem.

## Table of Contents

- [DeFi Terms](#defi-terms)
- [BitFlow-Specific Terms](#bitflow-specific-terms)
- [Stacks Blockchain Terms](#stacks-blockchain-terms)
- [Smart Contract Terms](#smart-contract-terms)
- [Financial Terms](#financial-terms)
- [Technical Terms](#technical-terms)

---

## DeFi Terms

### APR (Annual Percentage Rate)
The annualized interest rate without compounding.

**Example:** A 10% APR on a 1000 STX loan means 100 STX interest per year.

### APY (Annual Percentage Yield)
The annualized interest rate with compounding.

**Example:** A 10% APY with monthly compounding yields 10.47% effective return.

### Borrow
To take out a loan by locking collateral in a smart contract.

**BitFlow Example:**
```typescript
await borrow(1000, 10, 30); // Borrow 1000 STX at 10% APR for 30 days
```

### Collateral
Assets locked in a smart contract to secure a loan.

**BitFlow:** STX tokens deposited and locked when borrowing.

### Collateralization Ratio
The percentage of collateral value relative to loan value.

**Formula:**
```
Collateralization Ratio = (Collateral Value ÷ Loan Value) × 100
```

**BitFlow Requirement:** 150% (borrow up to 66.67% of collateral)

### DeFi (Decentralized Finance)
Financial services without traditional intermediaries (banks, brokers), powered by smart contracts.

### Flash Loan
An uncollateralized loan that must be repaid within the same transaction.

**Status in BitFlow:** Planned for Phase 3

### Health Factor
A metric indicating the safety of a collateralized position.

**BitFlow Formula:**
```
Health Factor = (Collateral Value ÷ Loan Value) × 100
```

**Ranges:**
- > 150%: Healthy ✅
- 120-150%: Warning ⚠️
- < 110%: Liquidatable 🚨

### Lend
To provide assets to a protocol for others to borrow, earning interest.

**BitFlow:** Depositing STX into the vault-core contract.

### Liquidation
The process of selling collateral to repay a loan when it becomes under-collateralized.

**BitFlow:** Triggered when health factor < 110%

### Liquidation Bonus
Incentive paid to liquidators for maintaining protocol solvency.

**BitFlow:** 5% of loan amount

### Liquidity
The ease with which an asset can be bought or sold without affecting its price.

### Liquidity Mining
Earning rewards (typically governance tokens) for providing liquidity to a protocol.

**BitFlow:** Planned for Phase 3

### Oracle
A service that provides external data (like prices) to smart contracts.

**BitFlow:** Will use Redstone or Pragma oracles for STX price feeds

### Over-Collateralized
A loan where collateral value exceeds loan value.

**BitFlow:** All loans are over-collateralized (150%)

### TVL (Total Value Locked)
The total amount of assets deposited in a DeFi protocol.

**BitFlow Example:** If users deposit 100,000 STX at $1.00 each → TVL = $100,000

### Under-Collateralized
A loan where collateral value is less than required, triggering liquidation.

**BitFlow:** Occurs when health factor < 110%

### Utilization Rate
The percentage of available funds that are currently borrowed.

**Formula:**
```
Utilization Rate = (Total Borrowed ÷ Total Deposits) × 100
```

**BitFlow Example:**
- Total Deposits: 10,000 STX
- Total Borrowed: 6,000 STX
- Utilization: 60%

### Yield Farming
Maximizing returns by moving assets between DeFi protocols.

---

## BitFlow-Specific Terms

### BitFlow
The name of this decentralized lending protocol on Stacks.

### BFLOW
The planned governance token for BitFlow (Phase 4).

**Utility:**
- Vote on protocol changes
- Earn staking rewards
- Fee discounts

### Bond NFT
Planned feature (Phase 3) to tokenize loans as tradeable NFTs.

**Use Case:** Lender can sell their loan to another party for immediate liquidity.

### vault-core
The main smart contract name for BitFlow's lending protocol.

**Contract Functions:**
- `deposit`
- `withdraw`
- `borrow`
- `repay`
- `liquidate`

### BitFlow Dashboard
The web interface for interacting with the vault-core contract.

**URL:** bitflow.finance (when launched)

---

## Stacks Blockchain Terms

### Bitcoin Layer 2
A blockchain that settles transactions on Bitcoin while enabling more complex functionality.

**Stacks Example:** Smart contracts secured by Bitcoin's proof-of-work.

### Block
A batch of transactions added to the blockchain.

**Stacks:** ~10 minute block time (Bitcoin's block time)

### Clarity
The smart contract programming language for Stacks.

**Features:**
- Decidable (can analyze before execution)
- No reentrancy bugs
- No integer overflow
- Interpreted (not compiled)

### microSTX (μSTX)
The smallest unit of STX.

**Conversion:** 1 STX = 1,000,000 microSTX

**BitFlow Usage:**
```typescript
const depositAmount = 1000; // STX
const microSTX = depositAmount * 1_000_000; // 1,000,000,000 microSTX
```

### Proof-of-Transfer (PoX)
Stacks' consensus mechanism where STX miners bid Bitcoin to mine blocks.

**Security:** Inherits Bitcoin's security

### Principal
A Stacks address (user or contract).

**User Principal Example:** `SP1ABC123...`  
**Contract Principal Example:** `SP1ABC123.vault-core`

### sBTC
Synthetic Bitcoin on Stacks (1:1 with Bitcoin).

**BitFlow:** Planned support in Phase 2

### SIP-010
Stacks Improvement Proposal for fungible tokens (like ERC-20 on Ethereum).

**BitFlow:** Future multi-asset support will use SIP-010 tokens

### STX (Stacks Token)
The native cryptocurrency of the Stacks blockchain.

**Uses:**
- Pay transaction fees
- Participate in PoX (Stack for BTC rewards)
- Use in DeFi applications like BitFlow

### Testnet
A test version of the blockchain for development and experimentation.

**BitFlow:** Currently deployed on Stacks Testnet

### Mainnet
The live, production version of the blockchain.

**BitFlow:** Planned launch Q1 2026

---

## Smart Contract Terms

### Call
Executing a function in a smart contract.

**Types:**
- **Public Call:** Modifies state, costs fees
- **Read-Only Call:** Reads state, free

### Clarity Value (CV)
A typed value in Clarity.

**Types:**
```typescript
uintCV(1000)              // Unsigned integer
principalCV("SP1ABC...")  // Principal (address)
stringAsciiCV("hello")    // ASCII string
boolCV(true)              // Boolean
tupleCV({...})            // Tuple (struct)
```

### Contract Address
The blockchain address where a smart contract is deployed.

**BitFlow Example:** `SP2XYZ789...` (TBD on mainnet)

### Gas / Transaction Fees
The cost to execute a transaction on the blockchain.

**Stacks:** Typically 0.001-0.01 STX per transaction

### Immutable
Cannot be changed after deployment.

**BitFlow:** The vault-core contract is immutable (no upgrades)

### Map
A key-value data structure in Clarity.

**BitFlow Example:**
```clarity
(define-map user-deposits principal uint)
```
Maps user addresses → deposit amounts

### Post-Conditions
Safety checks that ensure a transaction behaves as expected.

**Example:**
```typescript
// Ensure I don't send more than 1000 STX
makeStandardSTXPostCondition(
  myAddress,
  FungibleConditionCode.LessEqual,
  1000000000n // 1000 STX in microSTX
)
```

### Read-Only Function
A contract function that reads data without modifying state.

**BitFlow Examples:**
- `get-user-deposit`
- `get-loan`
- `get-health-factor`

### State
The current data stored in a smart contract.

**BitFlow State:**
- User deposits
- Active loans
- Total deposits
- Total borrowed

### Transaction (TX)
An action on the blockchain (deposit, withdraw, borrow, etc.).

**ID Format:** `0x1234abcd...` (64 characters)

---

## Financial Terms

### Basis Point (BPS)
1/100th of a percent (0.01%).

**Example:** 1000 basis points = 10%

**BitFlow Usage:**
```clarity
(define-constant interest-rate-bps u1000) ;; 10%
```

### Debt
The amount owed, including principal and interest.

**BitFlow:** `Total Debt = Principal + Interest`

### Default
Failure to repay a loan.

**BitFlow:** Prevented by liquidations; protocol is always repaid

### Interest
The cost of borrowing money, typically expressed as an annual percentage.

**BitFlow Calculation:**
```
Interest = Principal × Rate × (Time Elapsed ÷ Time Per Year)
```

### Loan
Borrowed funds that must be repaid with interest.

### Loan-to-Value (LTV)
The ratio of loan amount to collateral value.

**Formula:**
```
LTV = (Loan Value ÷ Collateral Value) × 100
```

**BitFlow Maximum LTV:** 66.67% (inverse of 150% collateralization)

### Principal
The original loan amount, excluding interest.

### Repayment
Paying back a loan with principal + interest.

**BitFlow:** Unlocks collateral upon full repayment

### Solvency
The protocol's ability to meet all obligations (all deposits can be withdrawn).

**BitFlow:** Maintained through over-collateralization and liquidations

---

## Technical Terms

### API (Application Programming Interface)
A set of functions for interacting with software.

**BitFlow API:** The vault-core contract's read-only and public functions

### Clarinet
A development tool for building and testing Clarity smart contracts.

**Commands:**
```bash
clarinet check        # Validate contract syntax
clarinet test         # Run tests
clarinet deploy       # Deploy to blockchain
```

### Dashboard
A web interface displaying user data and enabling interactions.

**BitFlow Dashboard:** Planned frontend for deposits, loans, liquidations

### Frontend
The user-facing part of an application (website/app).

**BitFlow:** React/Next.js dashboard (in development)

### GitHub
A platform for hosting and collaborating on code.

**BitFlow Repo:** [github.com/bitflow/vault-core](https://github.com/bitflow/vault-core)

### TypeScript
A typed programming language that compiles to JavaScript.

**BitFlow Integration:** Examples use TypeScript for type safety

### Vitest
A fast JavaScript testing framework.

**BitFlow:** Used for testing contract interactions

### Wallet
Software for managing cryptocurrency private keys and signing transactions.

**Supported by BitFlow:**
- Hiro Wallet
- Xverse
- Leather

### Web3
The decentralized internet powered by blockchain technology.

---

## Acronyms

| Acronym | Full Term | Meaning |
|---------|-----------|---------|
| APR | Annual Percentage Rate | Interest rate without compounding |
| APY | Annual Percentage Yield | Interest rate with compounding |
| BPS | Basis Points | 1/100th of a percent |
| DAO | Decentralized Autonomous Organization | Community-governed entity |
| DeFi | Decentralized Finance | Blockchain-based financial services |
| LTV | Loan-to-Value | Loan amount relative to collateral |
| NFT | Non-Fungible Token | Unique digital asset |
| PoX | Proof-of-Transfer | Stacks consensus mechanism |
| STX | Stacks Token | Native token of Stacks blockchain |
| TVL | Total Value Locked | Total assets in protocol |
| TX | Transaction | Blockchain action |

---

## Related Terms by Category

### Deposit Terms
- Deposit
- Lend
- Liquidity Provider
- TVL (Total Value Locked)
- Yield

### Loan Terms
- Borrow
- Collateral
- Principal
- Interest
- Debt
- Loan-to-Value (LTV)
- Collateralization Ratio

### Risk Terms
- Health Factor
- Liquidation
- Liquidation Bonus
- Under-Collateralized
- Over-Collateralized
- Solvency

### Blockchain Terms
- Block
- Transaction (TX)
- Gas / Fees
- Wallet
- Principal (Address)
- Smart Contract

### BitFlow Contract Terms
- vault-core
- deposit
- withdraw
- borrow
- repay
- liquidate
- get-health-factor

---

## Common Calculations

### Maximum Borrow Amount
```
Max Borrow = Deposit ÷ 1.5
```

### Interest Calculation
```
Interest = Principal × Rate × (Blocks Elapsed ÷ Blocks Per Year)
```

### Health Factor
```
Health Factor = (Collateral STX ÷ Loan STX) × 100
```

### Utilization Rate
```
Utilization = (Total Borrowed ÷ Total Deposits) × 100
```

### Liquidation Profit
```
Profit = Loan Amount × 0.05
```

### STX to microSTX
```
microSTX = STX × 1,000,000
```

---

## Additional Terms

### Basis Points (BPS)

A unit of measurement equal to 1/100th of 1%. Used for interest rates.

| BPS | Percentage |
|-----|-----------|
| 1 | 0.01% |
| 100 | 1% |
| 500 | 5% |
| 10000 | 100% |

### Block Height

The sequential number of a block on the blockchain. Used to track time in the BitFlow protocol. One block ≈ 10 minutes.

### Block Time

The average time between blocks on the Stacks blockchain. Approximately 10 minutes. Used to derive:
- Blocks per day: 144
- Blocks per year: 52,560

### Clarity

The smart contract language used on the Stacks blockchain. Clarity is decidable (not Turing-complete), which means you can know in advance exactly what a contract will do.

### Data Map

A key-value store in Clarity. BitFlow uses two maps:
- `user-deposits`: maps addresses to deposit amounts
- `user-loans`: maps addresses to loan details

### Data Variable

A single mutable value stored in the contract. BitFlow tracks: `total-deposits`, `total-repaid`, `total-liquidations`, `last-activity-block`, `initialized`, `contract-owner`.

### Gas Fee

The cost of executing a transaction on the blockchain. Paid in STX. Read-only function calls are free.

### Health Factor

The ratio of collateral value to debt (principal + interest), expressed as a percentage. Below 110% triggers liquidation eligibility.

### Immutable

Cannot be changed after deployment. All Clarity contracts are immutable — the code cannot be modified once deployed to the blockchain.

### Liquidator Bonus

The 5% incentive paid to liquidators from the borrower's seized collateral. Encourages timely liquidation of unhealthy positions.

### Mempool

The waiting area for transactions before they are included in a block. Transactions in the mempool are pending confirmation.

### microSTX

The smallest unit of STX. 1 STX = 1,000,000 microSTX. All contract operations use microSTX internally.

### Nonce

A sequential counter for each account's transactions. Ensures transactions are processed in order and prevents replay attacks.

### Post-Condition

A Stacks safety feature that verifies transaction outcomes match expectations. Prevents contracts from spending more tokens than authorized.

### Principal

A Stacks address (user or contract). The key type used for data map lookups in BitFlow.

### Read-Only Function

A contract function that reads data without modifying state. Free to call (no gas fee). Examples: `get-user-deposit`, `calculate-health-factor`.

### Simple Interest

Interest calculated only on the original principal, not on accumulated interest. BitFlow uses simple interest: `principal × rate × time`.

### tx-sender

The Clarity keyword representing the address that initiated the current transaction.

---

## Need More Definitions?

- **Technical Documentation:** [CONTRACTS.md](./CONTRACTS.md), [API.md](./API.md)
- **User Guide:** [FAQ.md](./FAQ.md), [EXAMPLES.md](./EXAMPLES.md)
- **Reference:** [Constants](./CONSTANTS_REFERENCE.md), [Errors](./ERROR_REFERENCE.md), [Acronyms](./ACRONYMS.md)

---

**Document Version:** 1.1.0
**Last Updated:** February 10, 2026

💡 **Tip:** Use Ctrl+F (or Cmd+F on Mac) to quickly find specific terms on this page!
