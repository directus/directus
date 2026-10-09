import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { isSafeUrl } from '../../../kernel/config/file.js';
import { CliError } from '../../../kernel/error.js';
import {
	ARTIFACT_MANIFEST_FILE,
	artifactFileName,
	type ArtifactWriteResult,
	readArtifactManifest,
	readArtifactStore,
	tryReadArtifactManifest,
	writeArtifactStore,
} from './artifact-store.js';
import { byCodepoint } from './codepoint.js';
import { normalizeInstanceUrl } from './id-map.js';
import { allResources } from './resources.js';

const REPAIR_HINT = 'Fix or delete the data directory, then run d6s sync pull again.';

export interface DataCollection {
	readonly collection: string;
	readonly primaryKey: string;
	readonly records: Record<string, unknown>[];
}

interface DataWriteResult extends ArtifactWriteResult {
	/** This pull's shortfalls plus the markers carried by preserved files. */
	readonly incomplete: string[];
}

interface DataReadResult {
	readonly source: string;
	readonly collections: DataCollection[];
	/**
	 * Collections the source silently truncated at pull time (reads filtered by license entitlements).
	 * Absence from an incomplete batch is not deletion consent, so merge and add stay safe but mirror
	 * must refuse.
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

// Only verified collections may carry incompleteness markers.
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

/** `'unknown'` means the stored metadata predates completeness tracking. */
interface CommittedData {
	readonly source: string;
	readonly incomplete: string[] | 'unknown';
}

function interpretMetadata(value: unknown): CommittedData {
	const source = sourceSchema.safeParse(value);

	if (!source.success) {
		throw new CliError('STATE', `${ARTIFACT_MANIFEST_FILE} does not record a valid source instance URL.`, {
			hint: 'This data predates source tracking (or the manifest was edited); delete the data directory, then run d6s sync pull again.',
		});
	}

	// Missing means a pre-tracking generation; present but invalid means corruption.
	if (!isPlainObject(value) || !Object.hasOwn(value as object, 'incomplete')) {
		return { source: source.data.source, incomplete: 'unknown' };
	}

	const incomplete = incompleteSchema.safeParse(value);

	if (!incomplete.success) {
		throw new CliError('STATE', `${ARTIFACT_MANIFEST_FILE} has an invalid "incomplete" marker.`, {
			hint: REPAIR_HINT,
		});
	}

	return { source: source.data.source, incomplete: incomplete.data.incomplete };
}

function committedState(dir: string): CommittedData | undefined {
	const manifest = readArtifactManifest(dir, {
		invalid: `${ARTIFACT_MANIFEST_FILE} is not a data manifest.`,
		hint: REPAIR_HINT,
	});

	if (manifest === undefined) return undefined;

	return interpretMetadata(manifest.metadata);
}

function assertMatchingDataSource(committed: CommittedData | undefined, dir: string, source: string): void {
	if (committed !== undefined && committed.source !== source) {
		throw new CliError('STATE', `The files in ${dir} came from ${committed.source}; this pull is from ${source}.`, {
			hint: 'Mixed sources corrupt identity mapping. Delete the data directory to switch this project to the new source, or declare a separate project for it.',
		});
	}
}

/** Pull checks before any write: `writeDataFiles` refuses too, but by then the schema files have changed. */
export function assertDataSource(dir: string, source: string): void {
	assertMatchingDataSource(committedState(dir), dir, source);
}

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

	// Fetched collections replace their marker; preserved ones keep it. Pre-tracking data has no marker to
	// keep, so it stays incomplete until a fetch verifies it.
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

	const result = writeArtifactStore({
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
 * Whether a write that skips this collection would preserve it. A corrupt manifest answers false rather
 * than throwing: strict validators already stop writes onto a corrupt tree, and throwing here would block
 * the healing pull.
 */
export function hasCommittedCollection(dir: string, collection: string): boolean {
	const manifest = tryReadArtifactManifest(dir);

	return manifest !== undefined && manifest.files.includes(artifactFileName(collection));
}

export function readDataFiles(dir: string): DataReadResult | undefined {
	if (!existsSync(join(dir, ARTIFACT_MANIFEST_FILE))) return undefined;

	const { metadata, artifacts } = readArtifactStore({
		dir,
		kind: 'data',
		missing: `No data found in ${dir}.`,
		missingHint: 'Run d6s sync pull first.',
		parseMetadata: (value): DataMetadata => {
			const committed = interpretMetadata(value);

			if (committed.incomplete === 'unknown') {
				throw new CliError('STATE', `${ARTIFACT_MANIFEST_FILE} does not record pull completeness.`, {
					hint: 'This data predates completeness tracking; run d6s sync pull again to record it.',
				});
			}

			return { source: committed.source, incomplete: committed.incomplete };
		},
		parseArtifact: parseDataFile,
	});

	return { source: metadata.source, collections: artifacts, incomplete: metadata.incomplete };
}
