import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { CliError } from '../kernel/error.js';
import { writeFileAtomic } from '../kernel/write.js';
import { byCodepoint } from './codepoint.js';
import {
	parseSnapshot,
	type Snapshot,
	SNAPSHOT_FULL,
	type SnapshotEntry,
	type SnapshotFieldEntry,
	type SnapshotRelationEntry,
} from './contract.js';

// The schema snapshot on disk as committable artifacts: one header file plus one file per
// collection, serialized so the same schema always produces identical bytes on any
// machine. That byte-determinism is the module's contract — it lets git show real schema
// changes and nothing else, and lets a hand-edited artifact fail loud on read.

const METADATA_FILE = 'metadata.json';

// An owned file is one this module writes and may delete: `${slug}_${hash}.json`. Ownership is
// recorded, not inferred from the name: metadata.json's `files` manifest lists exactly the
// collection files this store wrote, and only those are read or cleaned up. This regex never
// grants ownership on its own — a user's `notes_deadbeef.json` matches the shape yet is left
// untouched because it is absent from the manifest — it is the deletion path's second guard so a
// corrupted manifest cannot delete outside our naming shape, and the read path's confinement guard:
// the charset admits no `/` or `.`, so a traversal like `../outside.json` cannot match. The hash is
// 16 hex chars because 8 collides in practice (sha256-prefix-8 of two distinct real names matched).
const OWNED_FILE = /^[a-z0-9-]*_[0-9a-f]{16}\.json$/;

export interface WriteResult {
	readonly written: string[]; // filenames relative to dir, sorted
	readonly removed: string[]; // stale owned files deleted, sorted
}

export interface WriteScope {
	/**
	 * A collection is INSIDE the pull's scope iff inScope(name) is true. Inside-scope artifacts mirror the
	 * response (rewritten, or removed when absent — deleted at source). Outside-scope artifacts are
	 * preserved verbatim: file untouched, manifest entry carried forward. Without a scope every artifact
	 * is in scope (full mirror).
	 */
	readonly inScope: (collection: string) => boolean;
}

interface CollectionFile {
	readonly collection: string;
	readonly definition: SnapshotEntry | null;
	readonly fields: SnapshotFieldEntry[];
	readonly systemFields: SnapshotFieldEntry[];
	readonly relations: SnapshotRelationEntry[];
}

interface RawCollectionFile {
	readonly collection: string;
	readonly definition: unknown;
	readonly fields: readonly unknown[];
	readonly systemFields: readonly unknown[];
	readonly relations: readonly unknown[];
}

function byField(a: SnapshotFieldEntry, b: SnapshotFieldEntry): number {
	return byCodepoint(a.field, b.field);
}

function byRelation(a: SnapshotRelationEntry, b: SnapshotRelationEntry): number {
	return byCodepoint(a.field, b.field) || byCodepoint(a.related_collection ?? '', b.related_collection ?? '');
}

// Canonical form: object keys sorted at every depth, array order preserved as data.
// Combined with two-space indent, LF newlines, and a single trailing newline this yields the
// same bytes for the same schema regardless of key insertion order or how the snapshot's
// top-level arrays were ordered upstream.
function canonicalize(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(canonicalize);

	if (isPlainObject(value)) {
		const record = value as Record<string, unknown>;

		// Build via Object.fromEntries, never `result[key] = ...`: a legal field or option named
		// `__proto__` would otherwise hit the prototype setter and vanish from the artifact.
		return Object.fromEntries(
			Object.keys(record)
				.sort(byCodepoint)
				.map((key): [string, unknown] => [key, canonicalize(record[key])]),
		);
	}

	return value;
}

/**
 * The canonical serializer: object keys sorted at every depth (via canonicalize), two-space indent, LF
 * newlines, and a single trailing newline. Combined they yield the same bytes for the same value
 * regardless of key insertion order — the byte-determinism contract every on-disk artifact relies on.
 * Exported so the data store shares one serializer rather than forking a second, drifting copy. Two
 * spaces (not tabs) is the artifact format the spec fixes (Q16); source files stay on tabs.
 */
export function serializeCanonical(value: unknown): string {
	return `${JSON.stringify(canonicalize(value), null, 2)}\n`;
}

// The slug is display-only: it collides across case-variant and punctuation-variant names,
// so the sha256-derived hash (taken over the exact name, not the slug) disambiguates them.
// The `collection` key inside the file stays authoritative.
function fileName(collection: string): string {
	const slug = collection
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');

	const hash = createHash('sha256').update(collection).digest('hex').slice(0, 16);
	return `${slug}_${hash}.json`;
}

// metadata.json holds two keys. `files` is the ownership manifest: the sorted collection filenames
// written this pull (never metadata.json itself); since read and cleanup both key off it, provenance
// is recorded, not guessed from the directory listing. `snapshot` carries every top-level snapshot
// key except the four collection-partitioned arrays (which live in the owned per-collection files).
// Namespacing the header under `snapshot` keeps a future server-side top-level key from ever
// colliding with our `files` manifest key, and lets the CLI round-trip keys it does not model.
function header(snapshot: Snapshot, files: string[]): { files: string[]; snapshot: Record<string, unknown> } {
	const {
		collections: _collections,
		fields: _fields,
		systemFields: _systemFields,
		relations: _relations,
		...rest
	} = snapshot;

	return { files, snapshot: rest };
}

// Every collection name that appears anywhere in the snapshot gets one file grouping its
// definition and its fields, systemFields, and relations. The fields/systemFields split is
// server-side provenance the CLI cannot re-derive: systemFields carries indexed system-owned
// fields that live on ordinary collections (e.g. an `articles.id`), so a collection name never
// tells the two apart. Each array is filtered from its own snapshot bucket and never merged, so
// the split round-trips exactly as the server drew it.
function collectionFiles(snapshot: Snapshot): CollectionFile[] {
	const names = new Set<string>();
	for (const entry of snapshot.collections) names.add(entry.collection);
	for (const entry of snapshot.fields) names.add(entry.collection);
	for (const entry of snapshot.systemFields) names.add(entry.collection);
	for (const entry of snapshot.relations) names.add(entry.collection);

	const files: CollectionFile[] = [];

	for (const collection of names) {
		files.push({
			collection,
			definition: snapshot.collections.find((entry) => entry.collection === collection) ?? null,
			fields: snapshot.fields.filter((entry) => entry.collection === collection).sort(byField),
			systemFields: snapshot.systemFields.filter((entry) => entry.collection === collection).sort(byField),
			relations: snapshot.relations.filter((entry) => entry.collection === collection).sort(byRelation),
		});
	}

	return files;
}

const MANIFEST_HINT = 'Fix or delete the schema directory, then run d6s sync pull again.';

// The previous write's ownership manifest, read strictly because the write path's cleanup keys off
// it. Only a genuinely absent metadata.json is empty (a real first pull, nothing owned yet). Anything
// else wrong — unreadable, invalid JSON, not an object, a missing/non-array `files`, or a non-string
// entry — is corruption: swallowing it as "empty" would strand the previous generation's owned files
// as permanently unowned artifacts that a later push could resurrect, so it fails loud instead.
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

// The version tag the previous write recorded, or undefined when there is no previous metadata (a real
// first pull) or it carried no numeric version. Read leniently: readManifest already proved the file is
// a valid object with a valid `files` manifest, so this only sources the number that decides the artifact
// SET's version on a scoped write.
function readPreviousVersion(dir: string): number | undefined {
	const path = join(dir, METADATA_FILE);

	if (!existsSync(path)) return undefined;

	const header = loadObject(path, METADATA_FILE)['snapshot'];

	if (!isPlainObject(header)) return undefined;

	const version = (header as Record<string, unknown>)['version'];
	return typeof version === 'number' ? version : undefined;
}

export function writeSnapshotFiles(dir: string, snapshot: Snapshot, scope?: WriteScope): WriteResult {
	mkdirSync(dir, { recursive: true });

	// Read the previous manifest before touching anything: it is the only authority on what this
	// store owns and may clean up.
	const previous = readManifest(dir);

	// Precompute the filename-to-collection map before writing anything: a hash collision must be
	// DETECTED, never left probabilistic. Two distinct collections mapping to one filename would
	// otherwise silently clobber each other on disk. This arm is not unit-testable without a real
	// 64-bit collision — the read-side filename/collection agreement check covers the observable
	// surface — but the invariant is enforced here so a collision fails loud rather than corrupts.
	const byName = new Map<string, CollectionFile>();

	for (const file of collectionFiles(snapshot)) {
		const name = fileName(file.collection);
		const clash = byName.get(name);

		if (clash !== undefined) {
			throw new CliError('STATE', `Collections "${clash.collection}" and "${file.collection}" both map to ${name}.`);
		}

		byName.set(name, file);
	}

	// Write every collection file the response carries, collecting the names this pull newly owns. The
	// server only returns in-scope collections, so every response file is a mirror write regardless of
	// scope. Determinism makes an unchanged file byte-identical, so a rewrite is invisible to git.
	const targets = new Set<string>();
	const written: string[] = [];

	for (const [name, file] of byName) {
		targets.add(name);
		written.push(name);
		writeFileAtomic(join(dir, name), serializeCanonical(file), 0o644);
	}

	// Partition the previous manifest's owned files this write did not re-emit. A full pull (no scope)
	// mirrors the whole directory, so every such file is stale and removed — otherwise a dropped
	// collection resurrects on the next push. A scoped pull mirrors ONLY the collections inside its
	// scope: a previous file whose collection is OUTSIDE the scope is preserved verbatim (untouched on
	// disk, carried into the new manifest) so pulling one collection never destroys the schema around
	// it, while an inside-scope file absent from the response is still deleted (deleted at source). The
	// scope decision reads each file's authoritative `collection` key rather than trusting the filename;
	// a corrupt file fails loud (STATE) exactly as read does. OWNED_FILE stays the second guard so a
	// corrupted manifest can never delete or fold in anything outside our naming shape.
	const preserved: string[] = [];
	const removed: string[] = [];

	for (const name of previous) {
		if (targets.has(name) || !OWNED_FILE.test(name)) continue;

		if (scope !== undefined && !scope.inScope(readCollectionFile(dir, name).collection)) {
			preserved.push(name);
			continue;
		}

		rmSync(join(dir, name), { force: true });
		removed.push(name);
	}

	// The ownership manifest is the newly written files plus the preserved out-of-scope ones: read
	// consumes this set, so an out-of-scope collection dropped from it would vanish from the schema.
	const manifest = [...written, ...preserved].sort(byCodepoint);
	const meta = header(snapshot, manifest);

	// The version tag drives diff scoping server-side, so metadata must describe what the artifact SET
	// covers, not what this request fetched. A scoped pull that leaves out-of-scope files from a previous
	// FULL set (metadata version 1) in place still represents a full schema, so keep 1; trimming it to the
	// response's partial tag — or, conversely, tagging a genuinely partial set as full — is exactly the
	// mass-delete hazard. Otherwise the set's version is the response's, stored honestly as returned.
	if (scope !== undefined && preserved.length > 0 && readPreviousVersion(dir) === SNAPSHOT_FULL) {
		meta.snapshot['version'] = SNAPSHOT_FULL;
	}

	// Write metadata.json LAST: read refuses a directory without it, so it is the publish marker
	// for this pull. An interrupted first pull — collection files written, metadata not — reads
	// back as "no snapshot" rather than a plausible partial one, and its `files` manifest becomes
	// what the next read and the next cleanup treat as owned.
	writeFileAtomic(join(dir, METADATA_FILE), serializeCanonical(meta), 0o644);

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

	if (!isPlainObject(parsed)) throw new CliError('STATE', `${name} is not a schema file.`);

	return parsed as Record<string, unknown>;
}

// Read strictly: the write path always emits a string `collection` and all three arrays, so a
// missing or wrong-shaped key here is hand-editing, i.e. corruption, and must fail loud rather
// than coerce. Coercing a corrupted `"fields": {}` to `[]` would read the collection back as
// empty and let the next mirror push apply it as deleting every field. The fields/systemFields
// split is server-side provenance the read round-trips verbatim, so both arrays are required and
// checked. Entry contents stay verbatim so parseSnapshot names a bad entry downstream; the
// top-level `collection` stays authoritative for ordering, filenames, and cleanup only.
function readCollectionFile(dir: string, name: string): RawCollectionFile {
	const parsed = loadObject(join(dir, name), name);

	const collection = parsed['collection'];
	const fields = parsed['fields'];
	const systemFields = parsed['systemFields'];
	const relations = parsed['relations'];

	if (typeof collection !== 'string' || collection === '') {
		throw new CliError('STATE', `${name} is missing a valid "collection" name.`);
	}

	if (!Array.isArray(fields)) {
		throw new CliError('STATE', `${name} has a missing or non-array "fields".`);
	}

	if (!Array.isArray(systemFields)) {
		throw new CliError('STATE', `${name} has a missing or non-array "systemFields".`);
	}

	if (!Array.isArray(relations)) {
		throw new CliError('STATE', `${name} has a missing or non-array "relations".`);
	}

	return {
		collection,
		definition: parsed['definition'] ?? null,
		fields,
		systemFields,
		relations,
	};
}

export function readSnapshotFiles(dir: string): Snapshot {
	const metadataPath = join(dir, METADATA_FILE);

	if (!existsSync(dir) || !existsSync(metadataPath)) {
		throw new CliError('STATE', `No schema snapshot found in ${dir}.`, { hint: 'Run d6s sync pull first.' });
	}

	const metadata = loadObject(metadataPath, METADATA_FILE);

	// Membership is manifest-driven, never directory-driven: read exactly the files metadata.json
	// recorded. An unlisted file — even one matching the owned pattern — is not ours (e.g. a
	// user's `notes_deadbeef.json`) and is never read. A listed file that has since vanished is
	// corruption and must fail loud, naming it, not read back as an absent collection.
	const manifest = metadata['files'];

	if (!Array.isArray(manifest) || manifest.some((name) => typeof name !== 'string')) {
		throw new CliError('STATE', `${METADATA_FILE} is missing a valid "files" manifest.`);
	}

	const files: RawCollectionFile[] = [];
	const seen = new Set<string>();

	for (const name of manifest as string[]) {
		// Path confinement: the owned-file charset admits no `/` or `.`, so a hand-edited manifest
		// entry like `../outside.json` cannot match and dies here — repo content must never point a
		// sync read outside the schema directory.
		if (!OWNED_FILE.test(name)) {
			throw new CliError('STATE', `${METADATA_FILE} lists ${name}, which is not an owned schema file.`);
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
		// planted symlink cannot smuggle outside content into the snapshot.
		if (!lstatSync(path).isFile()) {
			throw new CliError('STATE', `${name} is not a regular file.`);
		}

		const file = readCollectionFile(dir, name);

		// Filename/collection agreement: the filename is derived from the collection name, so a
		// mismatch means a renamed file or a collision-duplicated one — refuse rather than fold the
		// wrong collection in under a name that no longer identifies it.
		if (fileName(file.collection) !== name) {
			throw new CliError(
				'STATE',
				`${name} contains collection "${file.collection}", which does not match its filename.`,
			);
		}

		files.push(file);
	}

	// Never trust manifest order for the reassembled arrays — sort by the authoritative internal
	// `collection` key so the result is deterministic regardless of how the manifest was ordered.
	files.sort((a, b) => byCodepoint(a.collection, b.collection));

	const collections: unknown[] = [];
	const fields: unknown[] = [];
	const systemFields: unknown[] = [];
	const relations: unknown[] = [];

	for (const file of files) {
		if (file.definition !== null) collections.push(file.definition);

		// Reassemble each array from its own bucket verbatim: the fields/systemFields split is
		// server provenance the CLI cannot re-derive from the collection name (systemFields holds
		// indexed system-owned fields on ordinary collections), so migrating an entry between the
		// two buckets would change how /schema/apply treats it.
		for (const entry of file.fields) fields.push(entry);
		for (const entry of file.systemFields) systemFields.push(entry);
		for (const entry of file.relations) relations.push(entry);
	}

	// The header is the `snapshot` object metadata.json namespaces every non-array top-level key
	// under (version, directus, vendor, and any key the CLI does not model). Reassemble the full
	// snapshot by laying the four collection-partitioned arrays over it, then validate as today —
	// the spread preserves unknown top-level keys the write path round-tripped.
	const snapshotHeader = metadata['snapshot'];

	if (!isPlainObject(snapshotHeader)) {
		throw new CliError('STATE', `${METADATA_FILE} is missing a valid "snapshot" header.`);
	}

	const assembled = {
		...(snapshotHeader as Record<string, unknown>),
		collections,
		fields,
		systemFields,
		relations,
	};

	try {
		return parseSnapshot(assembled);
	} catch (error) {
		// These files are hand-editable on disk, so a drift here is corrupted local state,
		// not an HTTP protocol break — rethrow under STATE while keeping the field-level
		// detail that names what drifted.
		if (error instanceof CliError) {
			throw new CliError(
				'STATE',
				`Schema files in ${dir} do not form a valid snapshot.`,
				error.detail === undefined ? {} : { detail: error.detail },
			);
		}

		throw error;
	}
}
