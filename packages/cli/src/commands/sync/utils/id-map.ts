import { existsSync, lstatSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { CliError } from '../../../kernel/error.js';
import { writeFileAtomic } from '../../../kernel/write.js';
import { serializeCanonicalJson } from './artifact-store.js';

type CollectionMap = Readonly<Record<string, Readonly<Record<string, string>>>>;
type TargetMap = Readonly<Record<string, CollectionMap>>;

/** Committed source→target record identities, nested by normalized instance URL and collection. */
export interface IdMap {
	readonly formatVersion: 1;
	readonly maps: Readonly<Record<string, TargetMap>>;
}

const REPAIR_HINT = 'Fix or delete the ID map file, then re-run.';

/** Collapses equivalent profile URLs onto one map key, while keeping non-default ports and paths apart. */
export function normalizeInstanceUrl(url: string): string {
	const parsed = new URL(url);
	const protocol = parsed.protocol.toLowerCase();
	const hostname = parsed.hostname.toLowerCase();

	let port = parsed.port;

	if ((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443')) {
		port = '';
	}

	const host = port === '' ? hostname : `${hostname}:${port}`;
	// The SDK treats a trailing slash as equivalent, so both spellings share one identity bucket.
	const pathname = parsed.pathname.replace(/\/+$/, '');

	return `${protocol}//${host}${pathname}`;
}

function readObject(value: unknown, path: string, what: string): Record<string, unknown> {
	if (!isPlainObject(value)) {
		throw new CliError('STATE', `${path} has a ${what} that is not an object.`, { hint: REPAIR_HINT });
	}

	return value as Record<string, unknown>;
}

function parseBucket(value: unknown, path: string): Readonly<Record<string, string>> {
	const record = readObject(value, path, 'collection bucket');
	const owners = new Map<string, string>();

	// fromEntries, not assignment: a record whose ID really is "__proto__" has to stay data.
	return Object.fromEntries(
		Object.keys(record).map((sourceId): [string, string] => {
			const targetId = record[sourceId];

			if (typeof targetId !== 'string') {
				throw new CliError('STATE', `${path} maps source id "${sourceId}" to a non-string target id.`, {
					hint: REPAIR_HINT,
				});
			}

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

/** A missing file is an empty first-sync state; a malformed one throws rather than being repaired. */
export function readIdMap(path: string): IdMap {
	if (!existsSync(path)) return { formatVersion: 1, maps: {} };

	// lstat refuses a committed symlink that would read a file outside the project, like the artifact stores do.
	if (!lstatSync(path).isFile()) {
		throw new CliError('STATE', `${path} is not a regular file.`, { hint: REPAIR_HINT });
	}

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

/** An object rather than two positional URLs: a transposed pair type-checks but corrupts identities. */
export interface InstancePair {
	readonly sourceUrl: string;
	readonly targetUrl: string;
}

export function mappingsFor(map: IdMap, pair: InstancePair): CollectionMap {
	const source = normalizeInstanceUrl(pair.sourceUrl);
	const target = normalizeInstanceUrl(pair.targetUrl);

	return map.maps[source]?.[target] ?? {};
}

/**
 * Does not mutate. A no-op merge returns the same object, so callers can treat `!==` as "the map changed".
 */
export function withMappings(
	map: IdMap,
	pair: InstancePair,
	collection: string,
	entries: Readonly<Record<string, string>>,
): IdMap {
	const source = normalizeInstanceUrl(pair.sourceUrl);
	const target = normalizeInstanceUrl(pair.targetUrl);

	const targetMap = map.maps[source] ?? {};
	const collectionMap = targetMap[target] ?? {};
	const bucket = collectionMap[collection] ?? {};

	if (Object.entries(entries).every(([sourceId, targetId]) => bucket[sourceId] === targetId)) return map;

	const mergedBucket = { ...bucket, ...entries };

	// Refuse a two-sources-one-target conflict at the merge that creates it, not on the next read.
	const owners = new Map<string, string>();

	for (const [sourceId, targetId] of Object.entries(mergedBucket)) {
		const owner = owners.get(targetId);

		if (owner !== undefined) {
			throw new CliError(
				'STATE',
				`${collection} would map source ids "${owner}" and "${sourceId}" to the same target id "${targetId}".`,
			);
		}

		owners.set(targetId, sourceId);
	}

	const mergedCollection = { ...collectionMap, [collection]: mergedBucket };
	const mergedTarget = { ...targetMap, [target]: mergedCollection };

	return { formatVersion: 1, maps: { ...map.maps, [source]: mergedTarget } };
}

export function writeIdMap(path: string, map: IdMap): void {
	mkdirSync(dirname(path), { recursive: true });
	writeFileAtomic(path, serializeCanonicalJson(map), 0o644);
}
