import { createPublicClient, http } from 'viem';
import { hyperEvm } from 'viem/chains';
import { kinetiqElysiumTestnet } from '../chains.js';

function configuredRpc(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/** HyperEVM mainnet. `HYPEREVM_RPC_URL` overrides viem's default RPC for chain 999. */
export function hyperEvmClient() {
  const rpc = configuredRpc('HYPEREVM_RPC_URL');
  return createPublicClient({
    chain: hyperEvm,
    transport: rpc ? http(rpc) : http(),
  });
}

/** Elysium testnet. The RPC is the one baked into `kinetiqElysiumTestnet` (`ELYSIUM_RPC_URL`). */
export function elysiumTestnetClient() {
  return createPublicClient({
    chain: kinetiqElysiumTestnet,
    transport: http(),
  });
}
