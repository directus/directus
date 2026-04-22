# License Lifecycle & Runtime

## Entry Points

- **Startup:** `initializeLicenseRuntime()` called at server boot, see [server.ts:172](api/src/server.ts#L172). If it throws, a warning is logged and boot continues (foundation PR is permissive).
- **Scheduled refresh:** [schedules/license-check.ts](api/src/schedules/license-check.ts) runs every 6h by default, configurable via `LICENSE_VALIDATE_SCHEDULE` cron env var.
- **CLI:** `api/src/cli/commands/license/{apply,deactivate}.ts` for ops operations.

## Refresh Modes

Two modes defined in [lifecycle.ts:35](api/src/license/lifecycle.ts#L35):

- **`startup`** — aggressive: can activate new keys, rotate, or validate. Runs once at boot.
- **`scheduled`** — conservative: only refreshes already-active licenses. Will **not** activate a new license from a cron tick (see [lifecycle.ts:149](api/src/license/lifecycle.ts#L149)).

This split prevents cron-driven unintended activations if the DB state is weird.

## Core Functions

All in [lifecycle.ts](api/src/license/lifecycle.ts):

- `applyLicense()` — entry point for applying a key. Decides between activate / validate / rotate based on the current binding state.
- `refreshLicense()` — called by startup + cron, gated by mode.
- `deactivateCurrentLicense()` — unbinds from the service, clears local state.
- `restoreStoredLicense()` — restores a valid stored token without calling the service (used to boot with cached state).
- `syncLicenseTokenFromService()` — fetches the latest token and persists it.

## Binding State

Computed in [binding.ts](api/src/license/binding.ts). Represents the **intersection** of:
- env license (if set)
- DB `directus_settings.license_key` + `license_token` + `license_status` + `license_terminal_status`
- project ID + key hash match check

Consumed by `applyLicense()` to decide the next action.

## Storage

Persisted columns on `directus_settings` (added by migration `20260219A-add-license-key`):
- `license_key`, `license_key_hash`
- `license_token` (JWT)
- `license_status` (`inactive` | `active` | `deactivated`)
- `license_terminal_status` (`canceled` | `expired` | `null`)
- `license_grace_on` (timestamp)

Persistence helpers in [storage.ts](api/src/license/storage.ts).

## Cache

Token payloads cached via [cache-token-payload.ts](api/src/utils/cache-token-payload.ts). TTL derived from token's own `exp`. Cleared on activate / validate / deactivate.
