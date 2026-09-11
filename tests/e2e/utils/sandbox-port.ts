import { getUID } from './getUID.js';

/**
 * Ports reserved for sandboxes that pick their own, kept clear of the per project baselines and
 * above 10080, the highest port `fetch` refuses to talk to.
 */
const FIRST = 11_000;
/** How many sandboxes a single test file can keep apart. */
const SLOTS = 10;
/** Ports per slot, so a sandbox running several instances still has room next to its own port. */
const STRIDE = 4;

/**
 * Every test file that starts its own sandbox, in the order their port windows are handed out.
 *
 * Add new files to the end. Two files sharing a window would take turns on the same port, which is
 * exactly what this avoids: a sandbox started right after another one was stopped fails to bind
 * while that port is still winding down.
 */
const FILES = [
	'app_cache',
	'auth_ldap',
	'auth_mcp-oauth-settings-gate',
	'auth_oauth-redirect',
	'collections_schema-cache',
	'deployments_webhook-project-scope',
	'endpoints_assets_cache',
	'endpoints_assets_limits',
	'endpoints_files_files',
	'endpoints_items_batch',
	'endpoints_server_health',
	'extensions_action-hooks',
	'fields_timezone_timezone',
	'flows_sync',
	'license_entitlements-gate-seats',
	'license_entitlements-gates',
	'license_entitlements-limits',
	'license_entitlements-open',
	'license_horizontal',
	'license_initialize',
	'license_rest-write',
	'logger_redact',
	'mail_notifications',
	'permissions_cache-purge',
	'schema_apply',
	'websockets_auth-modes',
	'websockets_collab_multi-instance',
	'websockets_multi-instance',
	'websockets_public-auth-failure',
];

/**
 * A port of its own for a sandbox, derived from the calling test file.
 *
 * Pass a different `slot` for each sandbox a single file starts.
 */
export function sandboxPort(slot = 0): number {
	const uid = getUID(1);
	const index = FILES.indexOf(uid);

	if (index === -1) {
		throw new Error(`No sandbox port window for "${uid}". Add it to FILES in utils/sandbox-port.ts.`);
	}

	return FIRST + index * SLOTS * STRIDE + (slot % SLOTS) * STRIDE;
}
