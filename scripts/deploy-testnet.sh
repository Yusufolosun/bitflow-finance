#!/bin/bash
set -e

echo "🚀 Deploying BitFlow Finance to Testnet..."

# Check if clarinet is installed
if ! command -v clarinet &> /dev/null; then
    echo "❌ Clarinet not found. Install from: https://github.com/hirosystems/clarinet"
    exit 1
fi

# Run checks
echo "📋 Running contract checks..."
clarinet check

# Run tests (using npm since clarinet test is deprecated)
echo "🧪 Running tests..."
npm test

# Deploy to testnet
echo "🚀 Deploying to testnet..."
echo "⚠️  Make sure you have STX in your testnet wallet for deployment fees"
clarinet deployments apply -p deployments/default.testnet-plan.yaml

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Update frontend/.env with contract address"
echo "2. Test the deployment on testnet"
echo "3. Monitor contract interactions"
