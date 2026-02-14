# BitFlow Finance

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)]()

Bitcoin-native fixed-rate lending protocol built on Stacks blockchain.

## Overview

BitFlow Finance enables users to lend and borrow STX with predictable, fixed interest rates secured by Bitcoin finality.

## Features

- **Fixed Interest Rates** - Lock in your rate at the time of borrowing
- **Collateralized Lending** - 150% collateralization requirement
- **Automated Liquidation** - Health factor monitoring with 110% threshold
- **Bitcoin Security** - Leverages Stacks' Bitcoin finality
- **Simple Interest** - Transparent and predictable yield calculations

## Mainnet Deployment

**Contract:** `SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193.bitflow-vault-core`

[View on Explorer](https://explorer.hiro.so/txid/SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193.bitflow-vault-core?chain=mainnet)

## Quick Start

### Deploy Locally
```bash
git clone https://github.com/Yusufolosun/bitflow-finance
cd bitflow-finance/bitflow-core
clarinet test
```

### Deploy to Testnet
```bash
clarinet deployments apply --testnet --low-cost
```

### Deploy to Mainnet
```bash
clarinet deployments apply --mainnet --low-cost
```

## Documentation

- [API Reference](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Security](./docs/SECURITY.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## Testing

```bash
clarinet test  # Run all tests
```

## Technology Stack

- **Smart Contracts:** Clarity
- **Frontend:** React + TypeScript
- **Testing:** Vitest + Clarinet
- **CI/CD:** GitHub Actions

## Contract Functions

### Core Functions
- `deposit` - Deposit STX as collateral
- `withdraw` - Withdraw unused collateral
- `borrow` - Take a fixed-rate loan
- `repay` - Repay loan with interest
- `liquidate` - Liquidate undercollateralized positions

### Read-Only Functions
- `get-user-deposit` - View collateral balance
- `get-user-loan` - View active loan details
- `calculate-health-factor` - Check liquidation risk
- `get-repayment-amount` - Calculate repayment due

## Security

- Non-Turing complete Clarity language prevents reentrancy
- Automated collateral ratio enforcement
- Health factor monitoring
- Comprehensive test coverage

## License

MIT

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

---

**Built on Stacks**
