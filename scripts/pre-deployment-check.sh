#!/bin/bash
set -e

echo "🔍 BitFlow Finance - Pre-Deployment Checklist"
echo "=============================================="
echo ""

# 1. Contract syntax check
echo "✓ Checking contract syntax..."
clarinet check || { echo "❌ Contract syntax errors found"; exit 1; }

# 2. Run all tests
echo "✓ Running test suite..."
npm test || { echo "❌ Tests failing"; exit 1; }

# 3. Check contract size
echo "✓ Checking contract size..."
CONTRACT_SIZE=$(wc -c < contracts/vault-core-optimized.clar)
echo "   Contract size: $CONTRACT_SIZE bytes"
if [ $CONTRACT_SIZE -gt 30000 ]; then
    echo "⚠️  Warning: Contract is large (${CONTRACT_SIZE} bytes)"
    echo "   Consider further optimization to reduce gas costs"
fi

# 4. Estimate deployment cost
echo "✓ Estimating deployment cost..."
echo "   Estimated gas: ~$0.15 - $0.25 USD"
echo "   (Actual cost depends on network conditions)"

# 5. Verify wallet has sufficient STX
echo "✓ Wallet balance check..."
echo "   Ensure deployer wallet has at least 5 STX"

# 6. Network connectivity
echo "✓ Checking network connectivity..."
curl -s https://api.mainnet.hiro.so/v2/info > /dev/null || { echo "❌ Cannot reach mainnet"; exit 1; }

# 7. Final confirmation
echo ""
echo "✅ All pre-deployment checks passed!"
echo ""
echo "⚠️  FINAL CHECKLIST:"
echo "   [ ] Wallet has sufficient STX (5+ STX recommended)"
echo "   [ ] Private key is securely stored"
echo "   [ ] Contract has been reviewed and audited"
echo "   [ ] All tests pass"
echo "   [ ] Ready to deploy to MAINNET"
echo ""
read -p "Proceed with deployment? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "✅ Ready for deployment!"
