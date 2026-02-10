#!/bin/bash
set -e

echo "🚀 BitFlow Finance - Safe Mainnet Deployment"
echo "==========================================="
echo ""

# Run pre-deployment checks first
./scripts/pre-deployment-check.sh || exit 1

echo ""
echo "🔐 SECURITY REMINDER:"
echo "   - Never share your private key"
echo "   - Verify contract address after deployment"
echo "   - Monitor the deployment transaction"
echo ""

# Generate deployment plan
echo "📝 Generating deployment plan..."
clarinet deployments generate --mainnet --low-cost

# Show estimated cost
echo ""
echo "💰 DEPLOYMENT COST ESTIMATE:"
echo "   Contract deployment: ~0.15-0.20 STX"
echo "   Transaction fee: ~0.001 STX"
echo "   Total: ~0.20 STX (~$0.15-$0.25 USD at current prices)"
echo ""

read -p "Confirm deployment to MAINNET? (type 'DEPLOY' to confirm): " FINAL_CONFIRM

if [ "$FINAL_CONFIRM" != "DEPLOY" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Deploy to mainnet
echo "🚀 Deploying to mainnet..."
clarinet deployments apply --mainnet

# Save deployment info
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "📋 Saving deployment info..."
clarinet deployments generate --mainnet --low-cost > deployments/mainnet_${TIMESTAMP}.yaml

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🔗 Next steps:"
echo "   1. Verify contract on Stacks Explorer"
echo "   2. Test basic functions (deposit/withdraw)"
echo "   3. Update frontend with contract address"
echo "   4. Monitor for any issues"
echo ""
