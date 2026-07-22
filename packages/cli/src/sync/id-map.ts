import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { CliError } from '../kernel/error.js';
import { writeFileAtomic } from '../kernel/write.js';
import { serializeCanonical } from './artifact-store.js';

type CollectionMap = Readonly<Record<string, Readonly<Record<string, string>>>>;
type TargetMap = Readonly<Record<string, CollectionMap>>;

/** Committed source→target record identities, nested by normalized instance URL and collection. */
export interface IdMap {
	readonly formatVersion: 1;
	readonly maps: Readonly<Record<string, TargetMap>>;
}

const REPAIR_HINT = 'Fix or delete the ID map file, then re-run.';

/**
 * Normalize equivalent profile URLs to one ID-map key while preserving non-default ports and paths.
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

// Parsers rebuild every level with Object.fromEntries so a legal "__proto__" record ID cannot invoke the
// prototype setter or disappear.
function readObject(value: unknown, path: string, what: string): Record<string, unknown> {
	if (!isPlainObject(value)) {
		throw new CliError('STATE', `${path} has a ${what} that is not an object.`, { hint: REPAIR_HINT });
	}

	return value as Record<string, unknown>;
}

function parseBucket(value: unknown, path: string): Readonly<Record<string, string>> {
	const record = readObject(value, path, 'collection bucket');
	const owners = new Map<string, string>();

	return Object.fromEntries(
		Object.keys(record).map((sourceId): [string, string] => {
			const targetId = record[sourceId];

			if (typeof targetId !== 'string') {
				throw new CliError('STATE', `${path} maps source id "${sourceId}" to a non-string target id.`, {
					hint: REPAIR_HINT,
				});
			}

			// A bucket must be injective: two sources sharing one target row have no single identity — both
			// would import onto the same row (last write wins) and unchanged detection would lie for one.
			// Reconcile never produces this (committed targets are excluded from matching), so it can only
			// arrive by hand-edit or a bad merge, and a corrupt map is refused rather than trusted.
			const owner = owners.get(targetId);

			if (owner !== undefined) {
				throw new CliError(
					'STATE',
					`${path} maps source ids "${owner}" and "${sourceId}" to the same target id "${targetId}".`,
					{ hint: REPAIR_HINT },
				);
			}

			owners.set(targetId, sourceId);

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
 * Read a strict ID map. A missing file is an empty first-sync state; malformed state is never trusted.
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
 * Return the collection buckets for one normalized, directional source/target pair.
 */
export function mappingsFor(map: IdMap, sourceUrl: string, targetUrl: string): CollectionMap {
	const source = normalizeInstanceUrl(sourceUrl);
	const target = normalizeInstanceUrl(targetUrl);

	return map.maps[source]?.[target] ?? {};
}

/**
 * Merge entries into one collection bucket without mutating the map. Empty entries preserve identity.
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

	// Object spread uses define semantics, preserving a "__proto__" ID as an own property.
	const mergedBucket = { ...bucket, ...entries };
	const mergedCollection = { ...collectionMap, [collection]: mergedBucket };
	const mergedTarget = { ...targetMap, [target]: mergedCollection };

	return { formatVersion: 1, maps: { ...map.maps, [source]: mergedTarget } };
}

/**
 * Write an ID map atomically in canonical key order.
 */
export function writeIdMap(path: string, map: IdMap): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileAtomic(path, serializeCanonical(map), 0o644);
}
