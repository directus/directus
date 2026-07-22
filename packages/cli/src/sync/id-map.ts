import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { CliError } from '../kernel/error.js';
import { writeFileAtomic } from '../kernel/write.js';
import { serializeCanonical } from './store.js';

// The committed ID map: <dir>/<project>/id_map.json, recording which source-instance record IDs were
// imported as which target-instance record IDs so a repeated import upserts instead of duplicating. It is
// committed rather than gitignored because a lost map recreates on the next clone or CI run the very
// duplicate problem it exists to prevent.
//
// Keyed by NESTED normalized instance URLs, never a delimited composite string: an IPv6 host such as
// http://[::1]:8055 embeds colons and would break any single-string delimiter. A source→target bucket and
// its reverse are distinct by construction — a remapping only holds in one direction. Written through the
// shared canonical serializer so object keys sort at every depth and a changed mapping is a one-line diff.

// Nesting, innermost first: one collection's sourceId→targetId bucket; the per-target set of those buckets
// keyed by collection; the per-source set of those keyed by normalized target URL. Modeled as nested
// Readonly Records so the URL keys never need a delimiter.
type CollectionMap = Readonly<Record<string, Readonly<Record<string, string>>>>;
type TargetMap = Readonly<Record<string, CollectionMap>>;

export interface IdMap {
	readonly formatVersion: 1;
	readonly maps: Readonly<Record<string, TargetMap>>;
}

const REPAIR_HINT = 'Fix or delete the ID map file, then re-run.';

/**
 * Canonical form of a profile URL so two spellings of the same instance key one bucket: lowercase the
 * protocol and host, drop the protocol's default port, and treat a bare "/" path as empty. An IPv6 host's
 * brackets and any non-default port survive intact — the reason the map nests URLs instead of joining them.
 * Config-validated URLs never throw here; a malformed string may throw TypeError, which is a caller bug
 * (callers pass already-validated profile URLs), not corrupt on-disk state.
 */
export function normalizeInstanceUrl(url: string): string {
	const parsed = new URL(url);
	const protocol = parsed.protocol.toLowerCase();
	const hostname = parsed.hostname.toLowerCase();

	let port = parsed.port;

	if ((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
		port = '';
	}

	const host = port === '' ? hostname : `${hostname}:${port}`;
	const pathname = parsed.pathname === '/' ? '' : parsed.pathname;

	return `${protocol}//${host}${pathname}`;
}

// Rebuild every level with Object.fromEntries, never obj[key] = value: a record ID can legally be the
// string "__proto__" (Directus primary keys are arbitrary), and an assignment would hit the prototype
// setter — dropping the mapping and risking prototype pollution, exactly the discipline store.ts follows.
// Each level must be an object down to the leaves, and every leaf a string; anything else is hand-editing
// and fails loud naming the path.
function readObject(value: unknown, path: string, what: string): Record<string, unknown> {
	if (!isPlainObject(value)) {
		throw new CliError('STATE', `${path} has a ${what} that is not an object.`, { hint: REPAIR_HINT });
	}

	return value as Record<string, unknown>;
}

function parseBucket(value: unknown, path: string): Readonly<Record<string, string>> {
	const record = readObject(value, path, 'collection bucket');

	return Object.fromEntries(
		Object.keys(record).map((sourceId): [string, string] => {
			const targetId = record[sourceId];

			if (typeof targetId !== 'string') {
				throw new CliError('STATE', `${path} maps source id "${sourceId}" to a non-string target id.`, {
					hint: REPAIR_HINT,
				});
			}

			return [sourceId, targetId];
		}),
	);
}

function parseCollectionMap(value: unknown, path: string): CollectionMap {
	const record = readObject(value, path, 'target entry');

	return Object.fromEntries(
		Object.keys(record).map((collection): [string, Readonly<Record<string, string>>] => [
			collection,
			parseBucket(record[collection], path),
		]),
	);
}

function parseTargetMap(value: unknown, path: string): TargetMap {
	const record = readObject(value, path, 'source entry');

	return Object.fromEntries(
		Object.keys(record).map((targetUrl): [string, CollectionMap] => [
			targetUrl,
			parseCollectionMap(record[targetUrl], path),
		]),
	);
}

function parseMaps(value: unknown, path: string): Readonly<Record<string, TargetMap>> {
	const record = readObject(value, path, '"maps" value');

	return Object.fromEntries(
		Object.keys(record).map((sourceUrl): [string, TargetMap] => [sourceUrl, parseTargetMap(record[sourceUrl], path)]),
	);
}

/**
 * An absent file is a real first sync: nothing has been mapped yet, so the empty map is legitimate. A
 * present file is parsed strictly — invalid JSON, a wrong formatVersion, or any node not matching the
 * nesting fails loud under STATE naming the path, so a hand-corrupted map can never seed a wrong upsert.
 */
export function readIdMap(path: string): IdMap {
	if (!existsSync(path)) return { formatVersion: 1, maps: {} };

	let raw: string;

	try {
		raw = readFileSync(path, 'utf8');
	} catch {
		throw new CliError('STATE', `Cannot read ${path}.`, { hint: REPAIR_HINT });
	}

	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new CliError('STATE', `${path} is not valid JSON.`, { hint: REPAIR_HINT });
	}

	if (!isPlainObject(parsed)) {
		throw new CliError('STATE', `${path} is not a valid ID map.`, { hint: REPAIR_HINT });
	}

	const record = parsed as Record<string, unknown>;

	if (record['formatVersion'] !== 1) {
		throw new CliError('STATE', `${path} has an unsupported formatVersion (expected 1).`, { hint: REPAIR_HINT });
	}

	return { formatVersion: 1, maps: parseMaps(record['maps'], path) };
}

/**
 * The collection→(sourceId→targetId) bucket for one normalized source/target pair, or {} when absent.
 * Normalizing both URLs here means a repointed-but-equivalent profile URL still finds its bucket, while
 * source→target and target→source stay separate.
 */
export function mappingsFor(map: IdMap, sourceUrl: string, targetUrl: string): CollectionMap {
	const source = normalizeInstanceUrl(sourceUrl);
	const target = normalizeInstanceUrl(targetUrl);

	return map.maps[source]?.[target] ?? {};
}

/**
 * A new IdMap with `entries` merged INTO (never replacing) the collection bucket for the normalized pair.
 * Pure — the input map is untouched. Empty entries return the same map so a no-op reconcile writes nothing.
 */
export function withMappings(
	map: IdMap,
	sourceUrl: string,
	targetUrl: string,
	collection: string,
	entries: Readonly<Record<string, string>>,
): IdMap {
	if (Object.keys(entries).length === 0) return map;

	const source = normalizeInstanceUrl(sourceUrl);
	const target = normalizeInstanceUrl(targetUrl);

	const targetMap = map.maps[source] ?? {};
	const collectionMap = targetMap[target] ?? {};
	const bucket = collectionMap[collection] ?? {};

	// Spread merges the new entries into the existing bucket and copies even a "__proto__" key as an own
	// property (object spread uses define semantics, never the prototype setter); the computed keys below
	// are safe for the same reason.
	const mergedBucket = { ...bucket, ...entries };
	const mergedCollection = { ...collectionMap, [collection]: mergedBucket };
	const mergedTarget = { ...targetMap, [target]: mergedCollection };

	return { formatVersion: 1, maps: { ...map.maps, [source]: mergedTarget } };
}

/**
 * Serialize canonically (sorted keys at every depth, LF, trailing newline) and write atomically, creating
 * the project directory if needed. Canonical output is what keeps a map change to a one-line git diff.
 */
export function writeIdMap(path: string, map: IdMap): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileAtomic(path, serializeCanonical(map), 0o644);
}
