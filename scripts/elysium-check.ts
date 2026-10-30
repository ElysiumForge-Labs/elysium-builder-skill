// Read-only sanity check for Elysium testnet: chain id, head block, gas price,
// canonical tokens, Multicall3, and whether HyperEVM-only precompiles exist (they should not).
// Run from the repository root: npm run elysium
import { formatUnits, parseAbi } from 'viem';
import { ELYSIUM_TESTNET } from './addresses.js';
import { kinetiqElysiumTestnet } from './chains.js';
import { exitWithError } from './lib/cli.js';
import { elysiumTestnetClient } from './lib/clients.js';

const erc20 = parseAbi(['function symbol() view returns (string)', 'function decimals() view returns (uint8)']);

const CANONICAL = [
  ['WHYPE', ELYSIUM_TESTNET.whype],
  ['USDC', ELYSIUM_TESTNET.usdc],
] as const;

async function main(): Promise<void> {
  const client = elysiumTestnetClient();
  const chainId = await client.getChainId();
  if (chainId !== kinetiqElysiumTestnet.id) {
    throw new Error(`Expected chain ${kinetiqElysiumTestnet.id}, RPC returned ${chainId}. Wrong RPC?`);
  }

  const [block, gasPrice] = await Promise.all([client.getBlockNumber(), client.getGasPrice()]);
  console.log(`chainId ${kinetiqElysiumTestnet.id} OK, block ${block}, gasPrice ${formatUnits(gasPrice, 9)} gwei`);

  for (const [label, address] of CANONICAL) {
    const [symbol, decimals] = await Promise.all([
      client.readContract({ address, abi: erc20, functionName: 'symbol' }),
      client.readContract({ address, abi: erc20, functionName: 'decimals' }),
    ]);
    console.log(`${label.padEnd(6)} ${address} symbol=${symbol} decimals=${decimals}`);
  }

  const multicall = await client.getCode({ address: ELYSIUM_TESTNET.multicall3 });
  console.log(`Multicall3 deployed: ${multicall !== undefined && multicall !== '0x'}`);

  for (const address of [ELYSIUM_TESTNET.hyperEvmPrecompile, ELYSIUM_TESTNET.coreWriter]) {
    const code = await client.getCode({ address });
    console.log(`${address} (HyperEVM-only) has code on Elysium: ${code !== undefined && code !== '0x'}`);
  }

  // estimateGas does not broadcast. The sender is only there so the RPC can price a 1-wei transfer.
  const gas = await client.estimateGas({
    account: ELYSIUM_TESTNET.whype,
    to: '0x000000000000000000000000000000000000dEaD',
    value: 1n,
  });
  console.log(`plain HYPE transfer estimateGas: ${gas} (above 21000 on Nitro, never hardcode 21000)`);
}

main().catch(exitWithError);
