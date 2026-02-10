# Testnet Deployment Checklist

## Pre-Deployment Verification ✅

### 1. Contract Validation
- [x] Contract renamed to `bitflow-vault-core.clar`
- [x] Clarinet syntax check passed (3 minor warnings, non-blocking)
- [x] All 63 tests passing (18 original + 45 comprehensive)
- [x] Contract path updated in deployment plan

### 2. Configuration Files Updated
- [x] `Clarinet.toml` - references bitflow-vault-core
- [x] `deployments/default.testnet-plan.yaml` - updated contract name and path
- [x] `deployments/default.simnet-plan.yaml` - auto-generated correctly
- [x] Deployment scripts updated

### 3. Test Coverage
- [x] Deposit tests (8 tests)
- [x] Withdrawal tests (7 tests)
- [x] Borrow tests (9 tests)
- [x] Repayment tests (8 tests)
- [x] Liquidation tests (8 tests)
- [x] Edge cases & integration tests (5 tests)
- [x] All original vault-core tests (18 tests)

### 4. Code Quality
- [x] Git commits follow conventional commit format
- [x] All changes documented in BUGFIXES.md
- [x] Code pushed to remote repository
- [x] No compilation errors

---

## Deployment Prerequisites 📋

### Wallet Setup
- [ ] Testnet wallet created (Hiro Wallet or Leather)
- [ ] Wallet funded with testnet STX (minimum 5 STX recommended)
- [ ] Deployer address: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`

### Get Testnet STX
1. Visit: https://explorer.hiro.so/sandbox/faucet?chain=testnet
2. Request testnet STX
3. Wait for confirmation (2-3 blocks ~20-30 minutes)

### Environment Setup
- [ ] Node.js installed (v16+)
- [ ] Clarinet installed (v2.0+)
- [ ] npm dependencies installed

---

## Deployment Steps 🚀

### Option 1: Automated Deployment (Recommended)
```bash
# Run the deployment script
./scripts/deploy-testnet.sh
```

The script will:
1. ✅ Check Clarinet installation
2. ✅ Run contract syntax validation
3. ✅ Execute full test suite
4. 🚀 Deploy to testnet
5. 📝 Provide next steps

### Option 2: Manual Deployment
```bash
# 1. Verify contract
clarinet check

# 2. Run tests
npm test

# 3. Deploy to testnet
clarinet deployments apply -p deployments/default.testnet-plan.yaml
```

---

## Post-Deployment Steps 📊

### 1. Verify Deployment
- [ ] Check transaction on Stacks Explorer
- [ ] Verify contract appears at deployment address
- [ ] Note contract address for frontend integration

**Explorer URL:**
```
https://explorer.hiro.so/txid/[TRANSACTION_ID]?chain=testnet
```

### 2. Contract Testing on Testnet
- [ ] Test deposit function
- [ ] Test withdrawal function
- [ ] Test borrow function (with sufficient collateral)
- [ ] Test repay function
- [ ] Test liquidation scenario

### 3. Frontend Integration
Update `frontend/src/config/contracts.ts`:
```typescript
testnet: {
  address: '[DEPLOYED_CONTRACT_ADDRESS]',
  contractName: 'bitflow-vault-core',
}
```

### 4. Initialize Contract (One-Time)
Call the `initialize` function after deployment:
```bash
# Using Clarinet
clarinet deployments apply -p deployments/default.testnet-plan.yaml
```

---

## Deployment Information 📝

### Contract Details
- **Contract Name:** `bitflow-vault-core`
- **File Path:** `contracts/bitflow-vault-core.clar`
- **Contract Size:** ~15KB
- **Estimated Gas Cost:** ~0.15-0.20 STX
- **Clarity Version:** 2.0
- **Epoch:** 2.5

### Network Settings
- **Network:** Stacks Testnet
- **API Endpoint:** `https://api.testnet.hiro.so`
- **Bitcoin Node:** `bitcoind.testnet.stacks.co:18332`

### Key Features
- 150% minimum collateralization ratio
- 110% liquidation threshold
- 5% liquidation bonus
- Fixed interest rates
- Multi-user support
- Comprehensive analytics

---

## Monitoring & Maintenance 🔍

### After Deployment
1. **Monitor Contract Activity**
   - Track deposits and withdrawals
   - Monitor active loans
   - Watch for liquidation events

2. **Performance Metrics**
   - Total Value Locked (TVL)
   - Number of active users
   - Liquidation success rate
   - Interest earned/paid

3. **Regular Checks**
   - Weekly: Review contract health
   - Monthly: Analyze usage patterns
   - Quarterly: Consider optimizations

### Testnet Explorer
- **Contract Explorer:** https://explorer.hiro.so/txid/[TX_ID]?chain=testnet
- **Address Explorer:** https://explorer.hiro.so/address/[ADDRESS]?chain=testnet

---

## Troubleshooting 🔧

### Common Issues

**Issue: "Insufficient balance" during deployment**
- **Solution:** Request more testnet STX from faucet

**Issue: "Contract already exists"**
- **Solution:** Contract name already deployed, update contract name or use different deployer

**Issue: "Transaction pending too long"**
- **Solution:** Wait for next Bitcoin block (10-15 minutes), or check mempool

**Issue: "Tests failing"**
- **Solution:** Run `npm test` to see specific failures, ensure all dependencies installed

### Support Resources
- Stacks Discord: https://discord.gg/stacks
- Clarinet Docs: https://docs.hiro.so/clarinet
- Stacks Docs: https://docs.stacks.co

---

## Next Steps After Successful Testnet Deployment 🎯

1. ✅ Update frontend configuration with deployed contract address
2. ✅ Test all contract functions through frontend
3. ✅ Run integration tests with real transactions
4. ✅ Gather user feedback on testnet
5. ✅ Monitor for any edge cases or bugs
6. ✅ Prepare for mainnet deployment (after thorough testing)

---

## Security Considerations ⚠️

- ✅ Contract has been comprehensively tested (63 tests)
- ✅ No critical security warnings from Clarinet
- ⚠️ Minor warnings about unchecked data (interest-rate, term-days) - expected behavior
- ✅ Liquidation mechanism tested and working
- ✅ No issues with collateral calculations
- ⚠️ Unused constant `ERR-LOAN-NOT-FOUND` - safe to keep for future use

**Recommendation:** Run testnet for at least 2-4 weeks before mainnet deployment

---

## Deployment Date
- **Prepared:** February 10, 2026
- **Status:** Ready for testnet deployment
- **Version:** 1.0.0
- **Last Commit:** 79d8564
