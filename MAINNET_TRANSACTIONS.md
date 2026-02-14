# Mainnet Transaction Reference

**Contract Address:** `SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193.bitflow-vault-core`

---

## Deployment

**Transaction ID:** `0xcbcdc451ddce9d53d2d0a4ba616ac09147b101fef41c1cd6cfe20978c49147d1`

**Details:**
- **Date:** February 10, 2026
- **Fee:** 0.14627 STX (~$0.04 USD)
- **Nonce:** 90
- **Status:** ✅ Success

**Explorer Links:**
- [Deployment Transaction](https://explorer.hiro.so/txid/0xcbcdc451ddce9d53d2d0a4ba616ac09147b101fef41c1cd6cfe20978c49147d1?chain=mainnet)
- [Contract Details](https://explorer.hiro.so/txid/SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193.bitflow-vault-core?chain=mainnet)

---

## Function Transactions

### 1. deposit

**Transaction ID:** `0xc94d4914cd62a2779b784776121e530a84821d705a7fcc86506b7ea77d97ba02`

**Arguments:**
- `amount`: 1000000 µSTX (1.0 STX)

**Result:** `(ok true)`

**Details:**
- **Fee:** 0.003 STX
- **Nonce:** 91
- **STX Transferred:** 1.0 STX → Contract

**Explorer:** [View Transaction](https://explorer.hiro.so/txid/0xc94d4914cd62a2779b784776121e530a84821d705a7fcc86506b7ea77d97ba02?chain=mainnet)

---

### 2. borrow

**Transaction ID:** `0xbe7c36418832baf764faf820d42f22b7ff0393b1efecbf36bac0b62eda0dd14b`

**Arguments:**
- `loan-amount`: 10000 µSTX (0.01 STX)
- `interest-rate-bps`: 10 (0.1% or 10 basis points)
- `loan-term-days`: 30 days

**Result:** `(ok true)`

**Details:**
- **Fee:** 0.003 STX
- **Nonce:** 92
- **STX Transferred:** 0.01 STX → Borrower (Contract → User)

**Explorer:** [View Transaction](https://explorer.hiro.so/txid/0xbe7c36418832baf764faf820d42f22b7ff0393b1efecbf36bac0b62eda0dd14b?chain=mainnet)

---

### 3. repay

**Transaction ID:** `0x20faab3b16cf5d8b864fe6cb9c9dd129a630bd4944614cca057472b38f8fcb60`

**Arguments:** None (automatically calculates repayment)

**Result:**
```clarity
(tuple 
  (interest uint 0)
  (principal uint 10000)
  (total uint 10000)
)
```

**Details:**
- **Fee:** 0.004187 STX
- **Nonce:** 93
- **STX Transferred:** 0.01 STX → Contract (User → Contract)
- **Interest Paid:** 0 µSTX (repaid early)
- **Principal Paid:** 10000 µSTX (0.01 STX)

**Explorer:** [View Transaction](https://explorer.hiro.so/txid/0x20faab3b16cf5d8b864fe6cb9c9dd129a630bd4944614cca057472b38f8fcb60?chain=mainnet)

---

### 4. withdraw

**Transaction ID:** `0xbbb7ae1c01ac58ad97c9f4a371d1c7fedd06b3439dade422eaf0d2b50e755f31`

**Arguments:**
- `amount`: 800000 µSTX (0.8 STX)

**Result:** `(ok true)`

**Details:**
- **Fee:** 0.003 STX
- **Nonce:** 94
- **STX Transferred:** 0.8 STX → User (Contract → User)

**Explorer:** [View Transaction](https://explorer.hiro.so/txid/0xbbb7ae1c01ac58ad97c9f4a371d1c7fedd06b3439dade422eaf0d2b50e755f31?chain=mainnet)

---

## Summary

**Total Transactions:** 10+ (Deployment + 4 verified function calls + additional activity)

**Function Test Results:**
- ✅ `deposit` - Successfully deposited 1.0 STX
- ✅ `borrow` - Successfully borrowed 0.01 STX at 0.1% for 30 days
- ✅ `repay` - Successfully repaid loan (0 interest due to early repayment)
- ✅ `withdraw` - Successfully withdrew 0.8 STX
- ⏳ `liquidate` - Not yet tested (no unhealthy positions)

**Total Value Processed:** 1.81+ STX

**Success Rate:** 100%

---

## Contract Interaction Examples

### Using Stacks CLI

```bash
# Read user deposit
stacks call-read-only \
  SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193 \
  bitflow-vault-core \
  get-user-deposit \
  -p SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193

# Read user loan
stacks call-read-only \
  SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193 \
  bitflow-vault-core \
  get-user-loan \
  -p SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193
```

### Using Explorer

Visit the contract page to interact directly:
[https://explorer.hiro.so/txid/SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193.bitflow-vault-core?chain=mainnet](https://explorer.hiro.so/txid/SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193.bitflow-vault-core?chain=mainnet)

---

**Last Updated:** February 14, 2026
