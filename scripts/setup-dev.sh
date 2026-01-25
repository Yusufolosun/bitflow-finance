#!/bin/bash
set -e

echo "🔧 Setting up BitFlow Finance development environment..."
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check for Node.js
if ! command_exists node; then
    echo "❌ Node.js not found"
    echo "📦 Please install Node.js from: https://nodejs.org/"
    exit 1
else
    echo "✅ Node.js found: $(node --version)"
fi

# Check for npm
if ! command_exists npm; then
    echo "❌ npm not found"
    echo "📦 Please install npm (usually comes with Node.js)"
    exit 1
else
    echo "✅ npm found: $(npm --version)"
fi

# Check for Clarinet
if ! command_exists clarinet; then
    echo ""
    echo "⚠️  Clarinet not found"
    echo "📦 Installing Clarinet is recommended for Clarity development"
    echo "   Visit: https://github.com/hirosystems/clarinet"
    echo ""
    read -p "Continue without Clarinet? (yes/no): " continue_without_clarinet
    
    if [ "$continue_without_clarinet" != "yes" ]; then
        echo "❌ Setup cancelled"
        exit 1
    fi
else
    echo "✅ Clarinet found: $(clarinet --version)"
fi

# Check for Git
if ! command_exists git; then
    echo "❌ Git not found"
    echo "📦 Please install Git from: https://git-scm.com/"
    exit 1
else
    echo "✅ Git found: $(git --version)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Installing dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Install frontend dependencies
if [ -d "frontend" ]; then
    echo ""
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  No frontend directory found"
fi

# Create .env file from .env.example if it doesn't exist
if [ -d "frontend" ] && [ -f "frontend/.env.example" ] && [ ! -f "frontend/.env" ]; then
    echo ""
    echo "📝 Creating .env file from .env.example..."
    cp frontend/.env.example frontend/.env
    echo "✅ Created frontend/.env"
    echo "⚠️  Remember to update .env with your configuration"
fi

# Run contract checks if Clarinet is available
if command_exists clarinet; then
    echo ""
    echo "📋 Running contract checks..."
    clarinet check
    echo "✅ Contract checks passed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Development environment setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next steps:"
echo "  1. Update frontend/.env with your configuration"
echo "  2. Run './scripts/run-tests.sh' to verify setup"
echo "  3. Start development with 'cd frontend && npm run dev'"
echo "  4. Read docs/ for development guidelines"
echo ""
echo "📚 Useful commands:"
echo "  - Run tests: ./scripts/run-tests.sh"
echo "  - Check coverage: ./scripts/check-coverage.sh"
echo "  - Lint code: ./scripts/lint.sh"
echo "  - Deploy testnet: ./scripts/deploy-testnet.sh"
echo ""
echo "Happy coding! 🚀"
