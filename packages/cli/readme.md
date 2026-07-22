# @directus/cli

Client-side CLI for Directus. Talks to instances over HTTP via `@directus/sdk`.

> **Status: internal.** Not published.

Distinct from `api/src/cli` (the server-process CLI that runs inside the Directus Node process). This one runs on a developer or CI machine and drives Directus instances remotely. Commands are built-in, statically registered groups — no dynamic loading. Environment Sync is the first command group.

## Development

    pnpm --filter @directus/cli build    # bundle to dist/ (tsdown)
    pnpm --filter @directus/cli dev      # watch build
    pnpm --filter @directus/cli test     # vitest
    node packages/cli/dist/bin.js --version

Bins: `directus-cli` and the short alias `d6s`.

## Environment Sync invariants

- Record IDs belong to an instance. The committed ID map translates source IDs to target IDs; natural-key reconciliation may extend it, but ambiguous identities require an explicit choice.
- Mirror batches are complete desired state for every included collection. An included empty collection therefore means delete its target rows; an omitted collection is outside that batch.
- Preview is conservative when record identity is ambiguous. Unlike an interactive push, it never prompts or updates the ID map while deciding what appears unchanged.
- Artifact ownership comes only from each directory's `metadata.json`; matching filenames do not imply ownership. The manifest is written last, but updates to an existing artifact set are not transactional.
- Schema drift is gated by the server-issued diff hash. Remote mutations wait for validation and approval, although reconciliation may persist local ID-map decisions first.
