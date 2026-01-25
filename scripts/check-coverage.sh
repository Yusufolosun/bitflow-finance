#!/bin/bash
set -e

echo "📊 Checking BitFlow Finance test coverage..."
echo ""

# Check if clarinet is installed
if ! command -v clarinet &> /dev/null; then
    echo "❌ Clarinet not found. Install from: https://github.com/hirosystems/clarinet"
    exit 1
fi

# Run tests with coverage
echo "🧪 Running tests with coverage analysis..."
clarinet test --coverage

echo ""
echo "✅ Coverage report generated!"
echo ""
echo "📋 Coverage files:"
echo "  - Check coverage/ directory for detailed reports"
echo ""
echo "💡 Tips:"
echo "  - Aim for >80% coverage on critical functions"
echo "  - Focus on edge cases and error handling"
echo "  - Add tests for uncovered code paths"
