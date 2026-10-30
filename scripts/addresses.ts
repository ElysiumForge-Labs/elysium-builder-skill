import type { Address } from 'viem';

/** Hyperliquid public info endpoint. No API key and no signing. */
export const HYPERLIQUID_INFO_URL = 'https://api.hyperliquid.xyz/info';

/**
 * kHYPE on HyperEVM mainnet (chain 999).
 * Source: https://kinetiq.xyz/docs/contracts-and-audits
 */
export const KHYPE = {
  token: '0xfD739d4e423301CE9385c1fb8850539D657C296D',
  stakingManager: '0x393D0B87Ed38fc779FD9611144aE649BA6082109',
  stakingAccountant: '0x9209648Ec9D448EF57116B73A2f081835643dc7A',
} as const satisfies Record<string, Address>;

/**
 * kmHYPE StakingManager. Hyperliquid reports this address as the deployer of the `km` and `mkts` dexes.
 * Source: https://kinetiq.xyz/docs/contracts-and-audits
 */
export const KMHYPE_STAKING_MANAGER: Address = '0x71F0019cC7fa79E4f42587FB7b9a817D8d2429EC';

/**
 * Elysium testnet (chain 99801).
 * Source: https://elysium.kinetiq.xyz/docs/contract-addresses
 * Multicall3 is the standard address used on most EVM chains.
 */
export const ELYSIUM_TESTNET = {
  whype: '0xCD57F65c2B0e5881CFC2E609F7CD53b746E1F234',
  usdc: '0x7D29d8047B905000459c0E80c34a26CeedcB47b2',
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
  hyperEvmPrecompile: '0x0000000000000000000000000000000000000800',
  coreWriter: '0x3333333333333333333333333333333333333333',
} as const satisfies Record<string, Address>;
