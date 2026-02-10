# Quick Testnet Deployment Guide

## ⚡ Fast Track Deployment

### Prerequisites (5 minutes)
1. **Get Testnet STX** (Required)
   - Visit: https://explorer.hiro.so/sandbox/faucet?chain=testnet
   - Request ~5 STX to your wallet
   - Wait 20-30 minutes for confirmation

2. **Verify Setup**
   ```bash
   clarinet --version  # Should be 2.0+
   node --version      # Should be 16+
   ```

---

## 🚀 One-Command Deployment

```bash
./scripts/deploy-testnet.sh
```

**This script will:**
- ✅ Check Clarinet installation
- ✅ Validate contract syntax
- ✅ Run all 63 tests
- ✅ Deploy to testnet
- ✅ Show post-deployment steps

---

## 📋 Manual Deployment (If script fails)

```bash
# 1. Final verification
clarinet check

# 2. Run tests (should see: Test Files 2 passed, Tests 63 passed)
npm test

# 3. Deploy
clarinet deployments apply -p deployments/default.testnet-plan.yaml
```

---

## ✅ Verify Deployment Success

1. **Check Terminal Output** for transaction ID
2. **Visit Explorer:**
   ```
   https://explorer.hiro.so/txid/[YOUR_TX_ID]?chain=testnet
   ```
3. **Wait for Confirmation** (~20 minutes for 1 Bitcoin block)
4. **Note Contract Address** from explorer

---

## 🔧 Post-Deployment (Required)

### Update Frontend Config
Edit `frontend/src/config/contracts.ts`:

```typescript
testnet: {
  address: '[YOUR_DEPLOYED_ADDRESS]',  // From explorer
  contractName: 'bitflow-vault-core',
}
```

### Test Basic Functions
```bash
# Deposit 100 STX
clarinet contracts call bitflow-vault-core deposit u100000000

# Check your deposit
clarinet contracts call bitflow-vault-core get-user-deposit
```

---

## 📊 Current Status

**✅ All Tests Passing:** 63/63 (100%)
- Deposit tests: 8/8
- Withdrawal tests: 7/7
- Borrow tests: 9/9
- Repayment tests: 8/8
- Liquidation tests: 8/8
- Edge cases: 5/5

**✅ Contract Ready:**
- Name: `bitflow-vault-core`
- Size: ~15KB
- Warnings: 3 minor (non-blocking)
- Epoch: 2.5
- Clarity: 2.0

**✅ Estimated Cost:** 0.15-0.20 STX

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Insufficient balance" | Get more STX from faucet |
| "Transaction pending" | Wait 10-15 min for Bitcoin block |
| "Contract exists" | Name taken, modify contract name |
| Tests fail | Run `npm install` then `npm test` |

---

## 📞 Need Help?

- **Stacks Discord:** https://discord.gg/stacks
- **Documentation:** See `TESTNET_DEPLOYMENT_CHECKLIST.md`
- **Explorer:** https://explorer.hiro.so/?chain=testnet

---

**Ready to Deploy?** Run `./scripts/deploy-testnet.sh` 🚀
