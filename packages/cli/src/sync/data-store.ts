import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { isSafeUrl } from '../kernel/config/file.js';
import { CliError } from '../kernel/error.js';
import { type ArtifactWriteResult, fileName, METADATA_FILE, readArtifacts, writeArtifacts } from './artifact-store.js';
import { byCodepoint } from './codepoint.js';
import { normalizeInstanceUrl } from './id-map.js';
import { allResources } from './resources.js';

/** One collection and its records in the data artifact set. */
export interface DataCollection {
	readonly collection: string;
	readonly primaryKey: string;
	readonly records: Record<string, unknown>[];
}

/** Files written and stale data artifacts removed by a data write, plus the effective incomplete set. */
export interface DataWriteResult extends ArtifactWriteResult {
	/** The committed incompleteness after the write: this pull's shortfalls plus markers carried by preserved files. */
	readonly incomplete: string[];
}

/** A validated data artifact set and its source instance. */
export interface DataReadResult {
	readonly source: string;
	readonly collections: DataCollection[];
	/**
	 * Collections whose export the source instance is known to have silently truncated (reads filtered by
	 * license entitlements). Recorded in the committed manifest so the knowledge survives to whoever
	 * pushes: merge/add stay safe, mirror must refuse — absence from an incomplete batch is not deletion
	 * consent.
	 */
	readonly incomplete: string[];
}

interface DataMetadata {
	readonly source: string;
	readonly incomplete: string[];
}

const dataFileSchema = z.object({
	collection: z.string().min(1),
	primaryKey: z.string().min(1),
	records: z.array(z.unknown()),
});

// Collections whose exports carry a pull-time completeness verification (see resources.ts verifyCount).
const VERIFY_TRACKED = new Set(
	allResources()
		.filter((resource) => resource.verifyCount === true)
		.map((resource) => resource.collection),
);

// The writer only ever records normalizeInstanceUrl() of an isSafeUrl-validated profile URL, so a
// legitimate committed source is a fixpoint of both. Anything else was hand-edited — and the value
// flows into JSON reports and ID-map bucket keys, so a credential-bearing or garbage source is
// refused here instead of leaking into logs or crashing as a native URL error downstream.
function isCommittedSource(value: string): boolean {
	return isSafeUrl(value) && normalizeInstanceUrl(value) === value;
}

const sourceSchema = z.object({ source: z.string().refine(isCommittedSource) });

// Only verify-tracked collections can legitimately carry the marker, and the entries are interpolated
// into terminal messages (the mirror refusal, the diff warning) — an unknown name or control-bearing
// string is refused rather than printed.
const incompleteSchema = z.object({
	incomplete: z.array(z.string().refine((collection) => VERIFY_TRACKED.has(collection))),
});

function pkString(record: Record<string, unknown>, primaryKey: string): string {
	const value = record[primaryKey];
	return value === undefined ? '' : String(value);
}

function dataFileBody(collection: DataCollection): DataCollection {
	const records = [...collection.records].sort((a, b) =>
		byCodepoint(pkString(a, collection.primaryKey), pkString(b, collection.primaryKey)),
	);

	return { collection: collection.collection, primaryKey: collection.primaryKey, records };
}

function parseDataFile(value: unknown, name: string): DataCollection {
	if (!isPlainObject(value)) throw new CliError('STATE', `${name} is not a data file.`);

	const result = dataFileSchema.safeParse(value);

	if (!result.success) {
		const field = result.error.issues[0]?.path[0];

		if (field === 'collection' || field === 'primaryKey') {
			throw new CliError('STATE', `${name} is missing a valid "${field}".`);
		}

		if (field === 'records') {
			throw new CliError('STATE', `${name} has a missing or non-array "records".`, {
				detail: z.prettifyError(result.error),
			});
		}

		throw new CliError('STATE', `${name} is not a data file.`, { detail: z.prettifyError(result.error) });
	}

	const { collection, primaryKey } = result.data;
	const records: Record<string, unknown>[] = [];
	const seen = new Set<string>();

	// Records feed the import, and under mirror absence from the batch means deletion — so a malformed
	// row is refused loud here rather than trusted: a non-object or PK-less row would import as a fresh
	// auto-ID record while every real row falls out of the batch, one hand-edit away from a destructive
	// push. Duplicate PKs are refused because record identity (the map, unchanged detection, mirror
	// survival) is keyed on them.
	for (const [index, value] of result.data.records.entries()) {
		if (!isPlainObject(value)) {
			throw new CliError('STATE', `${name} record ${index} is not an object.`);
		}

		const record = value as Record<string, unknown>;
		const pk = record[primaryKey];

		if (typeof pk !== 'string' && typeof pk !== 'number') {
			throw new CliError('STATE', `${name} record ${index} has no "${primaryKey}" primary key.`);
		}

		const key = String(pk);

		if (seen.has(key)) {
			throw new CliError('STATE', `${name} lists primary key "${key}" more than once.`);
		}

		seen.add(key);
		records.push(record);
	}

	return { collection, primaryKey, records };
}

function parseMetadata(value: unknown): DataMetadata {
	const source = sourceSchema.safeParse(value);

	if (!source.success) {
		// Pull's own preflight refuses this manifest too, so "re-pull" alone is dead advice: the data
		// directory has to go first.
		throw new CliError('STATE', `${METADATA_FILE} does not record a valid source instance URL.`, {
			hint: 'This data predates source tracking (or the manifest was edited); delete the data directory, then run d6s sync pull again.',
		});
	}

	// Required, not defaulted: an absent field means the export predates completeness tracking, and
	// reading it as "verified complete" would let mirror trust a possibly-truncated permissions export.
	const incomplete = incompleteSchema.safeParse(value);

	if (!incomplete.success) {
		// Absence is the pre-tracking generation (a plain re-pull records it); a PRESENT-but-invalid
		// marker is an edit, and a re-pull alone cannot repair it — the writer refuses the manifest.
		if (isPlainObject(value) && 'incomplete' in (value as Record<string, unknown>)) {
			throw new CliError('STATE', `${METADATA_FILE} has an invalid "incomplete" marker.`, {
				hint: 'Fix or delete the data directory, then run d6s sync pull again.',
			});
		}

		throw new CliError('STATE', `${METADATA_FILE} does not record export completeness.`, {
			hint: 'This data predates completeness tracking; run d6s sync pull again to record it.',
		});
	}

	return { source: source.data.source, incomplete: incomplete.data.incomplete };
}

type CommittedState = { exists: false } | { exists: true; source: string; incomplete: string[] | 'unknown' };

// The committed manifest's provenance and completeness, validated STRICTLY before any write builds on it:
// a lenient read here would let a pull relabel another instance's preserved records or launder away
// their incompleteness. Absent `incomplete` alone is tolerated as 'unknown' (pre-tracking generations).
function committedState(dir: string): CommittedState {
	const path = join(dir, METADATA_FILE);
	if (!existsSync(path)) return { exists: false };

	let parsed: unknown;

	try {
		parsed = JSON.parse(readFileSync(path, 'utf8'));
	} catch {
		throw new CliError('STATE', `${METADATA_FILE} is not valid JSON.`, {
			hint: 'Fix or delete the data directory, then run d6s sync pull again.',
		});
	}

	if (!isPlainObject(parsed)) {
		throw new CliError('STATE', `${METADATA_FILE} is not a data manifest.`, {
			hint: 'Fix or delete the data directory, then run d6s sync pull again.',
		});
	}

	const record = parsed as Record<string, unknown>;
	const source = sourceSchema.safeParse(record);

	if (!source.success) {
		throw new CliError('STATE', `${METADATA_FILE} does not record a valid source instance URL.`, {
			hint: 'This data predates source tracking (or the manifest was edited); delete the data directory, then run d6s sync pull again.',
		});
	}

	if (!('incomplete' in record)) {
		return { exists: true, source: source.data.source, incomplete: 'unknown' };
	}

	const incomplete = incompleteSchema.safeParse(record);

	if (!incomplete.success) {
		throw new CliError('STATE', `${METADATA_FILE} has an invalid "incomplete" marker.`, {
			hint: 'Fix or delete the data directory, then run d6s sync pull again.',
		});
	}

	return { exists: true, source: source.data.source, incomplete: incomplete.data.incomplete };
}

/**
 * Refuse when the committed data generation came from a different source instance. Exposed so pull can
 * run it BEFORE any write — a writer-level refusal alone would land after the schema files changed.
 */
export function assertDataSource(dir: string, source: string): void {
	const committed = committedState(dir);

	// Preserved files keep their CONTENT but the manifest records one source for the whole set — so a
	// pull from a different instance would relabel another instance's records as its own, and push would
	// remap them through the wrong ID-map bucket. Switching sources is a deliberate act: clear the data
	// or give the new source its own project.
	// committedState validated the stored source strictly, so it is safe to interpolate here.
	if (committed.exists && committed.source !== source) {
		throw new CliError(
			'STATE',
			`The committed data in ${dir} came from ${committed.source}; this pull is from ${source}.`,
			{
				hint: 'Mixed sources corrupt identity mapping. Delete the data directory to switch this project to the new source, or declare a separate project for it.',
			},
		);
	}
}

/** Write deterministic data artifacts and record the normalized source instance URL. */
export function writeDataFiles(
	dir: string,
	collections: DataCollection[],
	source: string,
	incomplete: readonly string[] = [],
): DataWriteResult {
	assertDataSource(dir, source);

	const committed = committedState(dir);
	const fetched = new Set(collections.map((entry) => entry.collection));
	const preservedCollections = new Set<string>();

	// This pull's shortfalls replace the state of every FETCHED collection; preserved files keep their
	// committed markers — a scoped pull that never touched permissions cannot vouch for them. A
	// pre-tracking generation ('unknown') marks every preserved verify-tracked collection incomplete:
	// nothing ever verified it, and only a re-fetch may clear the marker.
	const keptIncomplete = (): string[] => {
		let carried: string[] = [];

		if (committed.exists) {
			carried =
				committed.incomplete === 'unknown'
					? [...preservedCollections].filter((collection) => VERIFY_TRACKED.has(collection))
					: committed.incomplete.filter(
							(collection) => !fetched.has(collection) && preservedCollections.has(collection),
						);
		}

		return [...new Set([...incomplete, ...carried])].sort(byCodepoint);
	};

	const result = writeArtifacts({
		dir,
		artifacts: collections,
		body: dataFileBody,
		manifestHint: 'Fix or delete the data directory, then run d6s sync pull again.',
		// `incomplete` is written unconditionally: its absence is reserved for pre-tracking generations.
		metadata: ({ files }) => ({ files, source, incomplete: keptIncomplete() }),
		// A pull writes only what it fetched, and the fetch set shrinks legitimately all the time: a
		// resource-scoped or collection-scoped pull fetches a subset of what is committed. Deleting the
		// rest would wipe committed collections (the data half of the schema store's scope
		// rule). Removal is therefore a manual act: delete the file and its manifest line.
		preserve: {
			parse: parseDataFile,
			when: (artifact) => {
				const keep = !fetched.has(artifact.collection);
				if (keep) preservedCollections.add(artifact.collection);
				return keep;
			},
		},
	});

	return { ...result, incomplete: keptIncomplete() };
}

/** Whether a data artifact manifest exists at the given directory. */
export function hasDataFiles(dir: string): boolean {
	return existsSync(dir) && existsSync(join(dir, METADATA_FILE));
}

/**
 * Whether the committed data manifest lists a collection's artifact — i.e. the collection is part of the
 * committed tree that a write not refetching it will preserve. Lenient by design: this is a read-only
 * premise check consulted during pull, and the strict validators already stop any write that builds on a
 * corrupt tree — so an unreadable manifest answers false instead of turning a healable tree into a hard
 * pull failure.
 */
export function hasCommittedCollection(dir: string, collection: string): boolean {
	const path = join(dir, METADATA_FILE);
	if (!existsSync(path)) return false;

	let parsed: unknown;

	try {
		parsed = JSON.parse(readFileSync(path, 'utf8'));
	} catch {
		return false;
	}

	if (!isPlainObject(parsed)) return false;

	const files = (parsed as Record<string, unknown>)['files'];
	return Array.isArray(files) && files.includes(fileName(collection));
}

/** Read and validate the manifest-owned data artifacts. */
export function readDataFiles(dir: string): DataReadResult {
	const { metadata, artifacts } = readArtifacts({
		dir,
		kind: 'data',
		missing: `No data found in ${dir}.`,
		missingHint: 'Run d6s sync pull first.',
		parseMetadata,
		parseArtifact: parseDataFile,
	});

	return { source: metadata.source, collections: artifacts, incomplete: metadata.incomplete };
}
