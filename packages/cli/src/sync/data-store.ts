import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { CliError } from '../kernel/error.js';
import { writeFileAtomic } from '../kernel/write.js';
import { byCodepoint } from './codepoint.js';
import { serializeCanonical } from './store.js';

// The exported data records on disk as committable artifacts: one file per collection, each holding its
// records sorted by primary key and serialized so the same data always produces identical bytes on any
// machine. This mirrors the schema store's discipline — canonical serialization, a metadata.json
// ownership manifest, metadata-last writes, strict fail-loud reads — in a separate `data` directory the
// caller passes in. Records are the user's own content, written verbatim (no redaction), but
// determinism and manifest-owned cleanup are identical, so a committed diff shows real data changes and
// nothing else, and a hand-edited artifact fails loud on read.

const METADATA_FILE = 'metadata.json';

// An owned file is one this module writes and may delete: `${slug}_${hash}.json`. Ownership is recorded
// in the manifest, never inferred from the name. Replicated from the schema store (extracting it would
// touch store.ts beyond the allowed serializer export): it is the deletion path's second guard so a
// corrupted manifest cannot delete outside our naming shape, and the read path's confinement guard —
// the charset admits no `/` or `.`, so a traversal like `../outside.json` cannot match.
const OWNED_FILE = /^[a-z0-9-]*_[0-9a-f]{16}\.json$/;

export interface DataCollection {
	readonly collection: string; // e.g. 'directus_roles' or a user collection
	readonly primaryKey: string; // field records sort by
	readonly records: Record<string, unknown>[];
}

export interface DataWriteResult {
	readonly written: string[]; // filenames relative to dir, sorted (includes metadata.json)
	readonly removed: string[]; // stale owned files deleted, sorted
}

/**
 * The read shape: the exported collections plus the normalized URL of the instance they were pulled
 * from. Push needs the source to key the ID map's source→target bucket — it knows only the target — so
 * the source is committed alongside the data rather than re-derived (which would be a guess).
 */
export interface DataReadResult {
	readonly source: string; // normalizeInstanceUrl of the pulled-from instance, from metadata.json
	readonly collections: DataCollection[];
}

// The record's primary-key value as the string the PK sort compares. A record missing the key sorts
// first as the empty string; every other value passes through String(). Numeric ids therefore compare
// as their decimal text ("10" before "9") — accepted, because the contract here is byte-determinism,
// not numeric-natural order.
function pkString(record: Record<string, unknown>, primaryKey: string): string {
	const value = record[primaryKey];
	return value === undefined ? '' : String(value);
}

// The slug is display-only: it collides across case-variant and punctuation-variant names, so the
// sha256-derived hash (taken over the exact collection name) disambiguates them. Replicated from the
// schema store rather than shared, keeping the cross-module coupling to the serializer alone.
function fileName(collection: string): string {
	const slug = collection
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	const hash = createHash('sha256').update(collection).digest('hex').slice(0, 16);
	return `${slug}_${hash}.json`;
}

// One collection's on-disk shape: records sorted by primary key so record order in the export can never
// change the bytes. The canonical serializer sorts every object's keys at every depth, so key insertion
// order inside a record is invisible too; only the PK-sorted record sequence is authored here.
function dataFileBody(collection: DataCollection): {
	collection: string;
	primaryKey: string;
	records: Record<string, unknown>[];
} {
	const records = [...collection.records].sort((a, b) =>
		byCodepoint(pkString(a, collection.primaryKey), pkString(b, collection.primaryKey)),
	);

	return { collection: collection.collection, primaryKey: collection.primaryKey, records };
}

const MANIFEST_HINT = 'Fix or delete the data directory, then run d6s sync pull again.';

// The previous write's ownership manifest, read strictly because the write path's cleanup keys off it.
// Only a genuinely absent metadata.json is empty (a real first pull, nothing owned yet). Anything else
// wrong — unreadable, invalid JSON, not an object, a missing/non-array `files`, or a non-string entry —
// is corruption: swallowing it as "empty" would strand the previous write's owned files as permanently
// unowned artifacts a later run could resurrect, so it fails loud instead.
function readManifest(dir: string): string[] {
	const path = join(dir, METADATA_FILE);

	if (!existsSync(path)) return [];

	let raw: string;

	try {
		raw = readFileSync(path, 'utf8');
	} catch {
		throw new CliError('STATE', `Cannot read ${METADATA_FILE}.`, { hint: MANIFEST_HINT });
	}

	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new CliError('STATE', `${METADATA_FILE} is not valid JSON.`, { hint: MANIFEST_HINT });
	}

	if (!isPlainObject(parsed)) {
		throw new CliError('STATE', `${METADATA_FILE} is not a valid manifest.`, { hint: MANIFEST_HINT });
	}

	const files = (parsed as Record<string, unknown>)['files'];

	if (!Array.isArray(files) || files.some((name) => typeof name !== 'string')) {
		throw new CliError('STATE', `${METADATA_FILE} is missing a valid "files" manifest.`, { hint: MANIFEST_HINT });
	}

	return files as string[];
}

/**
 * `source` is the normalizeInstanceUrl of the instance this data was pulled from, threaded from the
 * pull's resolved target. It is recorded so a later push can look up the ID map's source→target bucket
 * without guessing which instance produced the committed records.
 */
export function writeDataFiles(dir: string, collections: DataCollection[], source: string): DataWriteResult {
	mkdirSync(dir, { recursive: true });

	// Read the previous manifest before touching anything: it is the only authority on what this store
	// owns and may clean up.
	const previous = readManifest(dir);

	// Precompute the filename map so a hash collision is DETECTED, never left to clobber silently: two
	// distinct collections mapping to one filename fail loud rather than overwrite each other on disk.
	const byName = new Map<string, DataCollection>();

	for (const collection of collections) {
		const name = fileName(collection.collection);
		const clash = byName.get(name);

		if (clash !== undefined) {
			throw new CliError(
				'STATE',
				`Collections "${clash.collection}" and "${collection.collection}" both map to ${name}.`,
			);
		}

		byName.set(name, collection);
	}

	// Write every collection file, collecting the names this write owns. Determinism makes an unchanged
	// file byte-identical, so a rewrite is invisible to git.
	const written: string[] = [];
	const targets = new Set<string>();

	for (const [name, collection] of byName) {
		targets.add(name);
		written.push(name);
		writeFileAtomic(join(dir, name), serializeCanonical(dataFileBody(collection)), 0o644);
	}

	// A data write is a full mirror of the exported set: any previously owned file this write did not
	// re-emit is stale and removed, or a dropped collection's records resurrect on the next read. Foreign
	// files are left alone — OWNED_FILE is the second guard so a corrupted manifest can never delete
	// outside our naming shape.
	const removed: string[] = [];

	for (const name of previous) {
		if (targets.has(name) || !OWNED_FILE.test(name)) continue;

		rmSync(join(dir, name), { force: true });
		removed.push(name);
	}

	const manifest = [...written].sort(byCodepoint);

	// Write metadata.json LAST: read refuses a directory without it, so it is this write's publish
	// marker, and its `files` manifest becomes what the next read and the next cleanup treat as owned.
	// `source` rides in the same manifest; the canonical serializer sorts the keys, so its placement is
	// deterministic regardless of insertion order.
	writeFileAtomic(join(dir, METADATA_FILE), serializeCanonical({ files: manifest, source }), 0o644);

	return { written: [METADATA_FILE, ...written].sort(byCodepoint), removed: removed.sort(byCodepoint) };
}

function loadObject(path: string, name: string): Record<string, unknown> {
	let raw: string;

	try {
		raw = readFileSync(path, 'utf8');
	} catch {
		throw new CliError('STATE', `Cannot read ${name}.`);
	}

	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		throw new CliError('STATE', `${name} is not valid JSON.`);
	}

	if (!isPlainObject(parsed)) throw new CliError('STATE', `${name} is not a data file.`);

	return parsed as Record<string, unknown>;
}

// Read strictly: the write path always emits a string `collection`, a string `primaryKey`, and an array
// `records`, so a missing or wrong-shaped key here is hand-editing, i.e. corruption, and must fail loud
// rather than coerce. Coercing a corrupted `"records": {}` to `[]` would read the collection back as
// empty and let the next import treat the empty set as authoritative. Record contents stay verbatim (the
// write wrote them verbatim); the top-level keys are authoritative for ordering, filenames, and cleanup.
function readDataFile(dir: string, name: string): DataCollection {
	const parsed = loadObject(join(dir, name), name);

	const collection = parsed['collection'];
	const primaryKey = parsed['primaryKey'];
	const records = parsed['records'];

	if (typeof collection !== 'string' || collection === '') {
		throw new CliError('STATE', `${name} is missing a valid "collection" name.`);
	}

	if (typeof primaryKey !== 'string' || primaryKey === '') {
		throw new CliError('STATE', `${name} is missing a valid "primaryKey".`);
	}

	if (!Array.isArray(records)) {
		throw new CliError('STATE', `${name} has a missing or non-array "records".`);
	}

	return { collection, primaryKey, records: records as Record<string, unknown>[] };
}

/**
 * Whether `dir` holds a committed data set: the directory exists and carries the metadata.json publish
 * marker readDataFiles requires. push probes this to treat an absent set as a schema-only checkout it may
 * skip, rather than letting readDataFiles throw — keeping the marker filename owned by this module alone.
 */
export function hasDataFiles(dir: string): boolean {
	return existsSync(dir) && existsSync(join(dir, METADATA_FILE));
}

export function readDataFiles(dir: string): DataReadResult {
	const metadataPath = join(dir, METADATA_FILE);

	if (!existsSync(dir) || !existsSync(metadataPath)) {
		throw new CliError('STATE', `No data found in ${dir}.`, { hint: 'Run d6s sync pull first.' });
	}

	const metadata = loadObject(metadataPath, METADATA_FILE);

	// The pulled-from instance URL is required, never inferred: push keys the ID map's source→target
	// bucket off it, and a wrong source would seed the wrong remaps. Data written before the field was
	// recorded (an older checkout) fails loud pointing at a re-pull rather than letting push guess.
	const source = metadata['source'];

	if (typeof source !== 'string' || source === '') {
		throw new CliError('STATE', `${METADATA_FILE} does not record the source instance URL.`, {
			hint: 'This data predates source tracking; run d6s sync pull again to record it.',
		});
	}

	// Membership is manifest-driven, never directory-driven: read exactly the files metadata.json
	// recorded. An unlisted file — even one matching the owned pattern — is not ours and is never read;
	// a listed file that has since vanished is corruption and must fail loud, naming it.
	const manifest = metadata['files'];

	if (!Array.isArray(manifest) || manifest.some((name) => typeof name !== 'string')) {
		throw new CliError('STATE', `${METADATA_FILE} is missing a valid "files" manifest.`);
	}

	const collections: DataCollection[] = [];
	const seen = new Set<string>();

	for (const name of manifest as string[]) {
		// Path confinement: the owned-file charset admits no `/` or `.`, so a hand-edited entry like
		// `../outside.json` cannot match and dies here — repo content must never point a sync read
		// outside the data directory.
		if (!OWNED_FILE.test(name)) {
			throw new CliError('STATE', `${METADATA_FILE} lists ${name}, which is not an owned data file.`);
		}

		if (seen.has(name)) {
			throw new CliError('STATE', `${METADATA_FILE} lists ${name} more than once.`);
		}

		seen.add(name);

		const path = join(dir, name);

		if (!existsSync(path)) {
			throw new CliError('STATE', `${METADATA_FILE} lists ${name}, but it is missing.`);
		}

		// A symlinked artifact could read a file from outside the tree; require a regular file so a
		// planted symlink cannot smuggle outside content into the data set.
		if (!lstatSync(path).isFile()) {
			throw new CliError('STATE', `${name} is not a regular file.`);
		}

		const file = readDataFile(dir, name);

		// Filename/collection agreement: the filename is derived from the collection name, so a mismatch
		// means a renamed or collision-duplicated file — refuse rather than fold the wrong collection in
		// under a name that no longer identifies it.
		if (fileName(file.collection) !== name) {
			throw new CliError(
				'STATE',
				`${name} contains collection "${file.collection}", which does not match its filename.`,
			);
		}

		collections.push(file);
	}

	// Never trust manifest order — sort by the authoritative internal `collection` key so the result is
	// deterministic regardless of how the manifest was ordered.
	collections.sort((a, b) => byCodepoint(a.collection, b.collection));

	return { source, collections };
}
