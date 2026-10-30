# elysium-builder-skill

Agent skill and read-only checks for building on Elysium, kHYPE, and Markets.

Part of [ElysiumForge Labs](https://github.com/ElysiumForge-Labs).

Give this folder to a coding agent and it can scaffold, configure, deploy, and verify an app on Elysium, integrate kHYPE on HyperEVM, read Markets HIP-3 perps, and prepare a Kinetiq Launch market.

Addresses, chain IDs, and RPCs in `references/` cite an official source and were cross-checked on 24 Oct 2026. The skill id inside `SKILL.md` is `kinetiq`. The package name is `elysium-builder-skill`.

## Layout

```
elysium-builder-skill/
  SKILL.md                  agent entry point: routing, rules, workflows, gotchas
  llms.txt                  one-page quick reference
  package.json              npm scripts for the checks
  tsconfig.json             strict TypeScript for scripts/
  .env.example              optional RPC overrides
  references/               detail the agent opens only when the task needs it
    contracts.md            addresses, chain IDs, RPCs, each with its source
    elysium.md              scaffold, deploy, verify, bridge, builder program
    khype-integration.md    rate, stake, unstake, wrapper traps, collateral
    markets-and-launch.md   Hyperliquid API, Markets trading API, Launch
    starter-ideas.md        nine app ideas with build checklists
  scripts/
    chains.ts               standalone Elysium testnet chain; copy this into an app
    addresses.ts            contract addresses used by the checks
    elysium-check.ts        Elysium testnet health check
    read-khype-rate.ts      kHYPE rate, limits, fees, pending withdrawals
    markets-snapshot.ts     Kinetiq HIP-3 dexes, live markets, top of book
    lib/                    shared CLI and RPC client helpers
```

`scripts/chains.ts` has no local imports, so it can be copied into a Next.js or Foundry-adjacent app without the rest of this package.

## Requirements

Node.js 20 or newer. Node.js 22 or newer if your own app opens a Hyperliquid WebSocket.

## Setup

```bash
npm install
```

The checks call public endpoints when no RPC is set. To use your own provider, export `ELYSIUM_RPC_URL` or `HYPEREVM_RPC_URL`. The names and the public defaults are in `.env.example`.

## Commands

These commands only read public chain and market data. They do not take a private key and they do not send transactions.

| Command | Network | What it prints |
| --- | --- | --- |
| `npm run elysium` | Elysium testnet (99801) | Chain id, canonical tokens, Multicall3, gas, precompile absence |
| `npm run khype -- 0xYourAddress` | HyperEVM mainnet (999) | kHYPE rate, limits, fee, and that address's pending withdrawals. The address is optional. |
| `npm run markets -- mkts` | Hyperliquid info API | Kinetiq HIP-3 dexes, live versus delisted markets, and the book of the first live market. Pass a coin as the second argument to pick one. |
| `npm run typecheck` | local | TypeScript compile check |

## Install the skill

**Claude Code.** Copy the folder into the skills directory. Claude loads it when you mention Kinetiq, Elysium, kHYPE, or Markets.

```bash
cp -r elysium-builder-skill ~/.claude/skills/kinetiq
# or, for one repo: cp -r elysium-builder-skill .claude/skills/kinetiq
```

**Codex.** Copy it to `~/.codex/skills/kinetiq` (or `.agents/skills/kinetiq` inside a repo), or add this line to `AGENTS.md`: "For Kinetiq, Elysium, kHYPE, or Markets work, read ./elysium-builder-skill/SKILL.md first."

**Cursor.** Keep the folder in the repo and add `.cursor/rules/kinetiq.mdc` with: "When working on Kinetiq, Elysium, kHYPE, or Markets by Kinetiq, read elysium-builder-skill/SKILL.md and follow its rules." You can also attach `elysium-builder-skill/llms.txt` with `@`.

**Grok Build.** Put the folder in the project and start the session with: "Read elysium-builder-skill/SKILL.md and follow it for this project."

**Any other agent.** Paste `llms.txt` into the context, then point the agent at `SKILL.md`.

## Prompt

```
You have the Kinetiq skill (elysium-builder-skill/SKILL.md). Read it and the reference file it routes to before writing code.

I want to build: <describe your app in one or two sentences>.

Rules:
- Start on testnet (Elysium testnet 99801 or HyperEVM testnet 998). Tell me which network every command targets.
- Use only addresses from references/contracts.md. If one is missing, tell me instead of guessing.
- Never ask for or write my private key. Use cast wallet import, a browser wallet, or Hardhat config variables.
- Before any transaction, show me the chain, contract, function and amounts, and wait for my yes.
- Run `npm run elysium` (or the relevant script) first to confirm the network is what we expect.

Plan the project as a checklist (scaffold, contracts, tests, deploy, verify, frontend), then build it step by step.
```

## What the agent is warned about

Twenty traps were checked against live chains on 24 Oct 2026. The ones that waste the most time:

- viem's `elysiumTestnet` is chain 1338 (Vulcan Forged), a different network. Use `scripts/chains.ts`, which defines chain 99801.
- `block.number` on Elysium returns the HyperEVM block. HyperEVM precompiles and CoreWriter are absent and fail silently.
- A plain HYPE transfer costs about 21,170 gas. `maxStakeAmount` of 0 means no cap. Unstaking needs an approval first.
- A wrapper contract receives the kHYPE, the withdrawal ids, and the returned HYPE.
- The legacy `km` dex is fully delisted. Markets lives on `mkts`.

Nine build checklists are in `references/starter-ideas.md`.

## Verify before use

Items marked "verify before use" or "NOT PUBLISHED" were not confirmed from an official source as of 24 Oct 2026. That includes the Elysium mainnet chain ID, RPC, and addresses (mainnet was announced for 9 Nov 2026), Kinetiq Launch factory addresses, and the builder revenue allocation formula. When mainnet ships, update `references/contracts.md` from https://elysium.kinetiq.xyz/docs/contract-addresses. Confirm addresses on the official docs before moving funds.

## License

MIT.

---

Unofficial community project. Not affiliated with Kinetiq/Hyperliquid.
