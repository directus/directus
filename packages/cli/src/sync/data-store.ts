import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { CliError } from '../kernel/error.js';
import { type ArtifactWriteResult, METADATA_FILE, readArtifacts, writeArtifacts } from './artifact-store.js';
import { byCodepoint } from './codepoint.js';

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

const metadataSchema = z.object({
	source: z.string().min(1),
	incomplete: z.array(z.string()).optional(),
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
	const result = metadataSchema.safeParse(value);

	if (!result.success) {
		throw new CliError('STATE', `${METADATA_FILE} does not record the source instance URL.`, {
			hint: 'This data predates source tracking; run d6s sync pull again to record it.',
		});
	}

	return { source: result.data.source, incomplete: result.data.incomplete ?? [] };
}

// The committed manifest's provenance, read leniently before a write: a missing or malformed manifest
// answers undefined and the write path's own validation deals with it.
function committedState(dir: string): { source: string | undefined; incomplete: string[] } {
	const path = join(dir, METADATA_FILE);
	if (!existsSync(path)) return { source: undefined, incomplete: [] };

	let parsed: unknown;

	try {
		parsed = JSON.parse(readFileSync(path, 'utf8'));
	} catch {
		return { source: undefined, incomplete: [] };
	}

	if (!isPlainObject(parsed)) return { source: undefined, incomplete: [] };

	const record = parsed as Record<string, unknown>;
	const source = typeof record['source'] === 'string' ? record['source'] : undefined;

	const incomplete = Array.isArray(record['incomplete'])
		? record['incomplete'].filter((entry): entry is string => typeof entry === 'string')
		: [];

	return { source, incomplete };
}

/** Write deterministic data artifacts and record the normalized source instance URL. */
export function writeDataFiles(
	dir: string,
	collections: DataCollection[],
	source: string,
	incomplete: readonly string[] = [],
): DataWriteResult {
	const committed = committedState(dir);

	// Preserved files keep their CONTENT but the manifest records one source for the whole set — so a
	// pull from a different instance would relabel another instance's records as its own, and push would
	// remap them through the wrong ID-map bucket. Switching sources is a deliberate act: clear the data
	// or give the new source its own project.
	if (committed.source !== undefined && committed.source !== source) {
		throw new CliError(
			'STATE',
			`The committed data in ${dir} came from ${committed.source}; this pull is from ${source}.`,
			{
				hint: 'Mixed sources corrupt identity mapping. Delete the data directory to switch this project to the new source, or declare a separate project for it.',
			},
		);
	}

	const fetched = new Set(collections.map((entry) => entry.collection));
	const preservedCollections = new Set<string>();

	// This pull's shortfalls replace the state of every FETCHED collection; preserved files keep their
	// committed markers — a scoped pull that never touched permissions cannot vouch for them.
	const carried = committed.incomplete.filter((collection) => !fetched.has(collection));
	const effective = [...new Set([...incomplete, ...carried])].sort(byCodepoint);

	const result = writeArtifacts({
		dir,
		artifacts: collections,
		body: dataFileBody,
		manifestHint: 'Fix or delete the data directory, then run d6s sync pull again.',
		metadata: ({ files }) => {
			// A marker only survives with its file: a carried collection whose file was manually removed
			// (and thus not preserved) drops out here.
			const kept = effective.filter((collection) => fetched.has(collection) || preservedCollections.has(collection));
			return { files, source, ...(kept.length > 0 ? { incomplete: kept } : {}) };
		},
		// A pull writes only what it fetched, and the fetch set shrinks legitimately all the time: a
		// resource-scoped pull, or any re-pull without --content, fetches a subset of what is committed.
		// Deleting the rest would wipe committed collections (the data half of the schema store's scope
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

	const kept = effective.filter((collection) => fetched.has(collection) || preservedCollections.has(collection));
	return { ...result, incomplete: kept };
}

/** Whether a data artifact manifest exists at the given directory. */
export function hasDataFiles(dir: string): boolean {
	return existsSync(dir) && existsSync(join(dir, METADATA_FILE));
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
