# @directus/cli

Client-side CLI for Directus. Talks to instances over HTTP via `@directus/sdk`.

> **Status: internal scaffolding.** Not published.

Distinct from `api/src/cli` (the server-process CLI that runs inside the Directus Node process). This one runs on a
developer or CI machine and drives Directus instances remotely. Commands are built-in, statically registered groups — no
dynamic loading. Environment Sync is the first planned command group.

## Development

    pnpm --filter @directus/cli build    # bundle to dist/ (tsdown)
    pnpm --filter @directus/cli dev      # watch build
    pnpm --filter @directus/cli test     # vitest
    node packages/cli/dist/bin.js --version

Bins: `directus-cli` and the short alias `d6s`.
