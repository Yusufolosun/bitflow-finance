import { StacksMainnet, StacksTestnet } from '@stacks/network';

/**
 * Contract Configuration
 * Manages contract addresses and network settings
 */

export const NETWORK_CONFIG = {
  testnet: new StacksTestnet(),
  mainnet: new StacksMainnet(),
};

// Toggle between 'testnet' and 'mainnet'
export const ACTIVE_NETWORK: 'testnet' | 'mainnet' = 'testnet';

// Get the active network instance
export const getNetwork = () => NETWORK_CONFIG[ACTIVE_NETWORK];

// Contract Details
export const VAULT_CONTRACT = {
  name: 'vault-core-v2', // Updated to v2 with critical borrow fix
  
  // Testnet deployment address (UPDATED: January 26, 2026)
  testnet: {
    address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'vault-core-v2', // v2 includes STX transfer fix in borrow function
  },
  
  // Mainnet deployment address
  mainnet: {
    address: 'SP1M46W6CVGAMH3ZJD3TKMY5KCY48HWAZK0DYG193',
    contractName: 'vault-core',
  },
};

// Get the active contract address
export const getContractAddress = () => {
  return ACTIVE_NETWORK === 'testnet' 
    ? VAULT_CONTRACT.testnet.address 
    : VAULT_CONTRACT.mainnet.address;
};

// Get the full contract identifier
export const getContractId = () => {
  const config = ACTIVE_NETWORK === 'testnet' 
    ? VAULT_CONTRACT.testnet 
    : VAULT_CONTRACT.mainnet;
  
  return `${config.address}.${config.contractName}`;
};

// Protocol Constants (should match contract)
export const PROTOCOL_CONSTANTS = {
  MIN_COLLATERAL_RATIO: 150, // 150%
  LIQUIDATION_THRESHOLD: 110, // 110%
  LIQUIDATION_BONUS: 5, // 5%
  BLOCKS_PER_YEAR: 52560, // Stacks blocks per year (approx)
  BLOCK_TIME_MINUTES: 10, // Average block time
};

// API Endpoints
export const API_ENDPOINTS = {
  testnet: 'https://api.testnet.hiro.so',
  mainnet: 'https://api.mainnet.hiro.so',
};

export const getApiEndpoint = () => {
  return ACTIVE_NETWORK === 'testnet' 
    ? API_ENDPOINTS.testnet 
    : API_ENDPOINTS.mainnet;
};

// Explorer URLs
export const EXPLORER_URLS = {
  testnet: 'https://explorer.hiro.so',
  mainnet: 'https://explorer.hiro.so',
};

export const getExplorerUrl = (txId?: string) => {
  const baseUrl = ACTIVE_NETWORK === 'testnet' 
    ? EXPLORER_URLS.testnet 
    : EXPLORER_URLS.mainnet;
  
  return txId 
    ? `${baseUrl}/txid/${txId}?chain=${ACTIVE_NETWORK}` 
    : `${baseUrl}?chain=${ACTIVE_NETWORK}`;
};
