import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { CliError } from '../kernel/error.js';
import { type ArtifactWriteResult, METADATA_FILE, readArtifacts, writeArtifacts } from './artifact-store.js';
import { byCodepoint } from './codepoint.js';

/** One collection and its records as committed in the data artifact set. */
export interface DataCollection {
	readonly collection: string;
	readonly primaryKey: string;
	readonly records: Record<string, unknown>[];
}

/** Files written and stale data artifacts removed by a data write. */
export type DataWriteResult = ArtifactWriteResult;

/** A validated committed data generation and its source instance. */
export interface DataReadResult {
	readonly source: string;
	readonly collections: DataCollection[];
}

interface DataMetadata {
	readonly source: string;
}

const dataFileSchema = z.object({
	collection: z.string().min(1),
	primaryKey: z.string().min(1),
	records: z.array(z.unknown()),
});

const metadataSchema = z.object({
	source: z.string().min(1),
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

	return result.data;
}

/** Write deterministic data artifacts and record the normalized source instance URL. */
export function writeDataFiles(dir: string, collections: DataCollection[], source: string): DataWriteResult {
	return writeArtifacts({
		dir,
		artifacts: collections,
		body: dataFileBody,
		manifestHint: 'Fix or delete the data directory, then run d6s sync pull again.',
		metadata: ({ files }) => ({ files, source }),
	});
}

/** Whether a committed data generation exists at the given directory. */
export function hasDataFiles(dir: string): boolean {
	return existsSync(dir) && existsSync(join(dir, METADATA_FILE));
}

/** Read and validate committed data artifacts. */
export function readDataFiles(dir: string): DataReadResult {
	const { metadata, artifacts } = readArtifacts({
		dir,
		kind: 'data',
		missing: `No data found in ${dir}.`,
		missingHint: 'Run d6s sync pull first.',
		parseMetadata,
		parseArtifact: parseDataFile,
	});

	return { source: metadata.source, collections: artifacts };
}
