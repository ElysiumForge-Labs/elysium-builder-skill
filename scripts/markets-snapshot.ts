// Read-only snapshot of Markets by Kinetiq HIP-3 perps via Hyperliquid's public info API.
// No API key, no signing.
// https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint
// Run from the repository root: npm run markets -- [dex] [coin]
import { HYPERLIQUID_INFO_URL, KMHYPE_STAKING_MANAGER } from './addresses.js';
import { exitWithError } from './lib/cli.js';

interface PerpDex {
  name?: string;
  fullName?: string;
  deployer?: string;
}

interface MarketMeta {
  name?: string;
  isDelisted?: boolean;
  maxLeverage?: number;
  onlyIsolated?: boolean;
}

interface AssetCtx {
  markPx?: string;
  dayNtlVlm?: string;
  openInterest?: string;
  funding?: string;
}

interface Meta {
  collateralToken?: number | string;
  universe: MarketMeta[];
}

interface BookLevel {
  px?: string;
  sz?: string;
}

async function info(body: unknown): Promise<unknown> {
  const response = await fetch(HYPERLIQUID_INFO_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`info ${JSON.stringify(body)} -> HTTP ${response.status}`);
  }
  return response.json() as Promise<unknown>;
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new Error(`${label} returned an unexpected shape`);
  }
  return value as Record<string, unknown>;
}

function parseDexes(value: unknown): (PerpDex | null)[] {
  if (!Array.isArray(value)) throw new Error('perpDexs returned an unexpected shape');
  return value.map((entry) => {
    if (entry === null) return null;
    const record = asRecord(entry, 'perpDexs');
    return {
      name: typeof record.name === 'string' ? record.name : undefined,
      fullName: typeof record.fullName === 'string' ? record.fullName : undefined,
      deployer: typeof record.deployer === 'string' ? record.deployer : undefined,
    };
  });
}

function parseMetaAndCtxs(value: unknown): { meta: Meta; ctxs: AssetCtx[] } {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error('metaAndAssetCtxs returned an unexpected shape');
  }
  const metaRecord = asRecord(value[0], 'metaAndAssetCtxs');
  if (!Array.isArray(metaRecord.universe) || !Array.isArray(value[1])) {
    throw new Error('metaAndAssetCtxs returned an unexpected shape');
  }
  const collateral = metaRecord.collateralToken;
  return {
    meta: {
      collateralToken: typeof collateral === 'number' || typeof collateral === 'string' ? collateral : undefined,
      universe: metaRecord.universe as MarketMeta[],
    },
    ctxs: value[1] as AssetCtx[],
  };
}

function parseBook(value: unknown): { bids: BookLevel[]; asks: BookLevel[] } {
  const record = asRecord(value, 'l2Book');
  if (!Array.isArray(record.levels)) throw new Error('l2Book returned an unexpected shape');
  const bids = record.levels[0];
  const asks = record.levels[1];
  return {
    bids: Array.isArray(bids) ? (bids as BookLevel[]) : [],
    asks: Array.isArray(asks) ? (asks as BookLevel[]) : [],
  };
}

function volume(value: string | undefined): string {
  if (value === undefined) return '-';
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed.toFixed(0) : value;
}

async function main(): Promise<void> {
  const dex = process.argv[2] ?? 'mkts';
  const dexes = parseDexes(await info({ type: 'perpDexs' }));
  const kinetiqDexes = dexes.filter(
    (entry): entry is PerpDex => entry?.deployer?.toLowerCase() === KMHYPE_STAKING_MANAGER.toLowerCase(),
  );
  const labels = kinetiqDexes.map((entry) => `${entry.name ?? '-'} (${entry.fullName ?? '-'})`);
  console.log(`HIP-3 dexes deployed by the kmHYPE StakingManager: ${labels.join(', ')}`);

  const { meta, ctxs } = parseMetaAndCtxs(await info({ type: 'metaAndAssetCtxs', dex }));
  console.log(`\ndex=${dex} collateralToken=${meta.collateralToken ?? '-'} (spot token index; 0 = USDC)`);
  meta.universe.forEach((market, index) => {
    const ctx = ctxs[index];
    const name = market.name ?? '-';
    const status = market.isDelisted ? 'DELISTED' : 'live';
    const isolated = market.onlyIsolated ? 'isolated-only ' : '';
    console.log(
      `${name.padEnd(16)} ${status.padEnd(8)} maxLev ${String(market.maxLeverage ?? '-').padEnd(3)} ${isolated}mark ${ctx?.markPx ?? '-'} 24hVol ${volume(ctx?.dayNtlVlm)} OI ${ctx?.openInterest ?? '-'} funding ${ctx?.funding ?? '-'}`,
    );
  });

  const coin = process.argv[3] ?? meta.universe.find((market) => !market.isDelisted)?.name;
  if (coin) {
    const { bids, asks } = parseBook(await info({ type: 'l2Book', coin }));
    const bid = bids[0];
    const ask = asks[0];
    console.log(
      `\n${coin} top of book: bid ${bid?.px ?? '-'} x ${bid?.sz ?? '-'} | ask ${ask?.px ?? '-'} x ${ask?.sz ?? '-'}`,
    );
  }
}

main().catch(exitWithError);
