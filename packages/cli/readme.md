# @directus/cli

Client-side, plugin-based CLI for Directus. Talks to instances over HTTP via `@directus/sdk`.

> **Status: internal scaffolding.** Not published, no stable plugin API yet.

Distinct from `api/src/cli` (the server-process CLI that runs inside the Directus Node
process). This one runs on a developer or CI machine and drives Directus instances
remotely. Environment Sync is the first core plugin.

## Development

    pnpm --filter @directus/cli build    # bundle to dist/ (tsdown)
    pnpm --filter @directus/cli dev      # watch build
    pnpm --filter @directus/cli test     # vitest
    node packages/cli/dist/bin.js --version

Bins: `directus-cli` and the short alias `d6s`.
