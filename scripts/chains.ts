// Standalone on purpose: copy this file into an app as-is. It has no local imports.
//
// HyperEVM mainnet/testnet: viem/chains (hyperEvm id 999, hyperliquidEvmTestnet id 998)
// Elysium testnet: https://elysium.kinetiq.xyz/docs/connecting-to-elysium
//                  https://elysium.kinetiq.xyz/docs/contract-addresses
//
// Do not import `elysiumTestnet` from viem/chains. That export is Vulcan Forged's
// Elysium (chain id 1338, LAVA gas), a different chain.
import { defineChain } from 'viem';
export { hyperEvm, hyperliquidEvmTestnet } from 'viem/chains';

const DEFAULT_ELYSIUM_TESTNET_RPC = 'https://testnet-rpc.elysium.kinetiq.xyz';

const elysiumRpcUrl =
  process.env.ELYSIUM_RPC_URL?.trim() ||
  process.env.NEXT_PUBLIC_ELYSIUM_RPC_URL?.trim() ||
  DEFAULT_ELYSIUM_TESTNET_RPC;

export const kinetiqElysiumTestnet = defineChain({
  id: 99801,
  name: 'Elysium Testnet',
  testnet: true,
  nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
  rpcUrls: {
    default: { http: [elysiumRpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Elysium testnet explorer', url: 'https://elysium.kinetiq.xyz/testnet-explorer' },
  },
  contracts: {
    multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' },
  },
});
