// Read-only kHYPE rate and StakingManager parameters on HyperEVM mainnet.
// Addresses: https://kinetiq.xyz/docs/integration and https://kinetiq.xyz/docs/contracts-and-audits
// Run from the repository root: npm run khype -- [address]
import { formatEther, isAddress, parseAbi, parseEther, type Address } from 'viem';
import { KHYPE } from './addresses.js';
import { exitWithError } from './lib/cli.js';
import { hyperEvmClient } from './lib/clients.js';

const accountantAbi = parseAbi([
  'function HYPEToKHYPE(uint256 HYPEAmount) view returns (uint256)',
  'function kHYPEToHYPE(uint256 kHYPEAmount) view returns (uint256)',
]);

const managerAbi = parseAbi([
  'function minStakeAmount() view returns (uint256)',
  'function maxStakeAmount() view returns (uint256)',
  'function stakingLimit() view returns (uint256)',
  'function totalStaked() view returns (uint256)',
  'function withdrawalDelay() view returns (uint256)',
  'function unstakeFeeRate() view returns (uint256)',
  'function nextWithdrawalId(address user) view returns (uint256)',
  'function withdrawalRequests(address user, uint256 id) view returns ((uint256 hypeAmount, uint256 kHYPEAmount, uint256 kHYPEFee, uint256 bufferUsed, uint256 timestamp))',
]);

const erc20Abi = parseAbi([
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
]);

type Client = ReturnType<typeof hyperEvmClient>;

async function printAccount(client: Client, user: Address, delay: bigint): Promise<void> {
  const [balance, next] = await Promise.all([
    client.readContract({ address: KHYPE.token, abi: erc20Abi, functionName: 'balanceOf', args: [user] }),
    client.readContract({
      address: KHYPE.stakingManager,
      abi: managerAbi,
      functionName: 'nextWithdrawalId',
      args: [user],
    }),
  ]);
  console.log(`\n${user}\nkHYPE balance       ${formatEther(balance)}\nnextWithdrawalId    ${next}`);

  const now = BigInt(Math.floor(Date.now() / 1000));
  for (let id = 0n; id < next; id++) {
    const request = await client.readContract({
      address: KHYPE.stakingManager,
      abi: managerAbi,
      functionName: 'withdrawalRequests',
      args: [user, id],
    });
    if (request.timestamp === 0n) continue;
    const readyAt = request.timestamp + delay;
    const when = now >= readyAt ? 'READY to confirm' : `ready in ${Number(readyAt - now) / 3600} h`;
    console.log(`  id ${id}: ${formatEther(request.hypeAmount)} HYPE, ${when}`);
  }
}

async function main(): Promise<void> {
  const userArg = process.argv[2];
  if (userArg !== undefined && !isAddress(userArg)) {
    throw new Error(`Not an address: ${userArg}`);
  }

  const client = hyperEvmClient();
  const one = parseEther('1');
  const [block, hypePerKhype, khypePerHype, minStake, maxStake, limit, totalStaked, delay, feeBps, supply] =
    await Promise.all([
      client.getBlockNumber(),
      client.readContract({
        address: KHYPE.stakingAccountant,
        abi: accountantAbi,
        functionName: 'kHYPEToHYPE',
        args: [one],
      }),
      client.readContract({
        address: KHYPE.stakingAccountant,
        abi: accountantAbi,
        functionName: 'HYPEToKHYPE',
        args: [one],
      }),
      client.readContract({ address: KHYPE.stakingManager, abi: managerAbi, functionName: 'minStakeAmount' }),
      client.readContract({ address: KHYPE.stakingManager, abi: managerAbi, functionName: 'maxStakeAmount' }),
      client.readContract({ address: KHYPE.stakingManager, abi: managerAbi, functionName: 'stakingLimit' }),
      client.readContract({ address: KHYPE.stakingManager, abi: managerAbi, functionName: 'totalStaked' }),
      client.readContract({ address: KHYPE.stakingManager, abi: managerAbi, functionName: 'withdrawalDelay' }),
      client.readContract({ address: KHYPE.stakingManager, abi: managerAbi, functionName: 'unstakeFeeRate' }),
      client.readContract({ address: KHYPE.token, abi: erc20Abi, functionName: 'totalSupply' }),
    ]);

  console.log(`block               ${block}`);
  console.log(`1 kHYPE  -> HYPE    ${formatEther(hypePerKhype)}`);
  console.log(`1 HYPE   -> kHYPE   ${formatEther(khypePerHype)}`);
  console.log(`minStakeAmount      ${formatEther(minStake)} HYPE`);
  console.log(`maxStakeAmount      ${formatEther(maxStake)} HYPE`);
  console.log(`stakingLimit        ${formatEther(limit)} HYPE`);
  console.log(`totalStaked         ${formatEther(totalStaked)} HYPE`);
  console.log(`kHYPE totalSupply   ${formatEther(supply)}`);
  console.log(`withdrawalDelay     ${delay} s (${Number(delay) / 86400} days, contract delay only)`);
  console.log(`unstakeFeeRate      ${feeBps} bps`);

  if (userArg !== undefined && isAddress(userArg)) {
    await printAccount(client, userArg, delay);
  }
}

main().catch(exitWithError);
