import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { isSafeUrl } from '../../../kernel/config/file.js';
import { CliError } from '../../../kernel/error.js';
import { type ArtifactWriteResult, fileName, METADATA_FILE, readArtifacts, writeArtifacts } from './artifact-store.js';
import { byCodepoint } from './codepoint.js';
import { normalizeInstanceUrl } from './id-map.js';
import { allResources } from './resources.js';

const REPAIR_HINT = 'Fix or delete the data directory, then run d6s sync pull again.';

/** One collection and its records in the data artifact set. */
export interface DataCollection {
	readonly collection: string;
	readonly primaryKey: string;
	readonly records: Record<string, unknown>[];
}

interface DataWriteResult extends ArtifactWriteResult {
	/** The stored incompleteness after the write: this pull's shortfalls plus markers carried by preserved files. */
	readonly incomplete: string[];
}

interface DataReadResult {
	readonly source: string;
	readonly collections: DataCollection[];
	/**
	 * Collections whose pull the source instance is known to have silently truncated (reads filtered by
	 * license entitlements). Recorded in stored metadata so the knowledge survives to whoever
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

const VERIFY_TRACKED = new Set(
	allResources()
		.filter((resource) => resource.verifyCount === true)
		.map((resource) => resource.collection),
);

// Refuse edited source URLs before they leak into reports or corrupt ID-map bucket identity.
function isCommittedSource(value: string): boolean {
	return isSafeUrl(value) && normalizeInstanceUrl(value) === value;
}

const sourceSchema = z.object({ source: z.string().refine(isCommittedSource) });

// Only verified collections may carry incompleteness markers that later reach terminal output.
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

	// Malformed or duplicate identities could turn hand-edited artifacts into destructive mirror batches.
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

/** A stored generation's provenance; `'unknown'` means the metadata predates completeness tracking. */
interface CommittedData {
	readonly source: string;
	readonly incomplete: string[] | 'unknown';
}

function interpretMetadata(value: unknown): CommittedData {
	const source = sourceSchema.safeParse(value);

	if (!source.success) {
		throw new CliError('STATE', `${METADATA_FILE} does not record a valid source instance URL.`, {
			hint: 'This data predates source tracking (or the manifest was edited); delete the data directory, then run d6s sync pull again.',
		});
	}

	// Missing means a pre-tracking generation; present but invalid means corruption.
	if (!isPlainObject(value) || !Object.hasOwn(value as object, 'incomplete')) {
		return { source: source.data.source, incomplete: 'unknown' };
	}

	const incomplete = incompleteSchema.safeParse(value);

	if (!incomplete.success) {
		throw new CliError('STATE', `${METADATA_FILE} has an invalid "incomplete" marker.`, {
			hint: REPAIR_HINT,
		});
	}

	return { source: source.data.source, incomplete: incomplete.data.incomplete };
}

// Validate provenance and completeness before a write can relabel preserved records or erase warnings.
function committedState(dir: string): CommittedData | undefined {
	const path = join(dir, METADATA_FILE);
	if (!existsSync(path)) return undefined;

	let parsed: unknown;

	try {
		parsed = JSON.parse(readFileSync(path, 'utf8'));
	} catch {
		throw new CliError('STATE', `${METADATA_FILE} is not valid JSON.`, {
			hint: REPAIR_HINT,
		});
	}

	if (!isPlainObject(parsed)) {
		throw new CliError('STATE', `${METADATA_FILE} is not a data manifest.`, {
			hint: REPAIR_HINT,
		});
	}

	return interpretMetadata(parsed);
}

function assertMatchingDataSource(committed: CommittedData | undefined, dir: string, source: string): void {
	// One manifest cannot safely relabel preserved records from another source instance.
	if (committed !== undefined && committed.source !== source) {
		throw new CliError('STATE', `The files in ${dir} came from ${committed.source}; this pull is from ${source}.`, {
			hint: 'Mixed sources corrupt identity mapping. Delete the data directory to switch this project to the new source, or declare a separate project for it.',
		});
	}
}

/**
 * Refuse when the stored data generation came from a different source instance. Exposed so pull can
 * run it BEFORE any write — a writer-level refusal alone would land after the schema files changed.
 */
export function assertDataSource(dir: string, source: string): void {
	assertMatchingDataSource(committedState(dir), dir, source);
}

/** Write deterministic data artifacts and record the normalized source instance URL. */
export function writeDataFiles(
	dir: string,
	collections: DataCollection[],
	source: string,
	incomplete: readonly string[] = [],
): DataWriteResult {
	const committed = committedState(dir);
	assertMatchingDataSource(committed, dir, source);
	const fetched = new Set(collections.map((entry) => entry.collection));
	const preservedCollections = new Set<string>();

	// Fetched collections replace their marker; preserved collections keep it.
	// Pre-tracking preserved data stays incomplete until re-fetched and verified.
	const keptIncomplete = (): string[] => {
		let carried: string[] = [];

		if (committed !== undefined) {
			carried =
				committed.incomplete === 'unknown'
					? [...preservedCollections].filter((collection) => VERIFY_TRACKED.has(collection))
					: committed.incomplete.filter(
							(collection) => !fetched.has(collection) && preservedCollections.has(collection),
						);
		}

		return [...new Set([...incomplete, ...carried])].sort(byCodepoint);
	};

	let effectiveIncomplete: string[] | undefined;

	const result = writeArtifacts({
		dir,
		artifacts: collections,
		body: dataFileBody,
		manifestHint: REPAIR_HINT,
		metadata: ({ files }) => {
			effectiveIncomplete = keptIncomplete();
			return { files, source, incomplete: effectiveIncomplete };
		},
		// Scoped pulls preserve unfetched data; removal is an explicit manual act.
		preserve: {
			parse: parseDataFile,
			when: (artifact) => {
				const keep = !fetched.has(artifact.collection);
				if (keep) preservedCollections.add(artifact.collection);
				return keep;
			},
		},
	});

	if (effectiveIncomplete === undefined) throw new Error('data store: metadata was not computed');
	return { ...result, incomplete: effectiveIncomplete };
}

/**
 * Whether the stored data metadata lists a collection's artifact — i.e. the collection is part of the
 * stored tree that a write not refetching it will preserve. Lenient by design: this is a read-only
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

/** Read and validate the metadata-owned data artifacts, or undefined when nothing is stored. */
export function readDataFiles(dir: string): DataReadResult | undefined {
	if (!existsSync(join(dir, METADATA_FILE))) return undefined;

	const { metadata, artifacts } = readArtifacts({
		dir,
		kind: 'data',
		missing: `No data found in ${dir}.`,
		missingHint: 'Run d6s sync pull first.',
		parseMetadata: (value): DataMetadata => {
			const committed = interpretMetadata(value);

			if (committed.incomplete === 'unknown') {
				throw new CliError('STATE', `${METADATA_FILE} does not record pull completeness.`, {
					hint: 'This data predates completeness tracking; run d6s sync pull again to record it.',
				});
			}

			return { source: committed.source, incomplete: committed.incomplete };
		},
		parseArtifact: parseDataFile,
	});

	return { source: metadata.source, collections: artifacts, incomplete: metadata.incomplete };
}
