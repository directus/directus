import { isPlainObject } from 'lodash-es';
import { z } from 'zod';
import { CliError } from '../kernel/error.js';
import { type ArtifactWriteResult, METADATA_FILE, readArtifacts, writeArtifacts } from './artifact-store.js';
import { byCodepoint } from './codepoint.js';
import {
	parseSnapshot,
	type Snapshot,
	SNAPSHOT_FULL,
	type SnapshotEntry,
	type SnapshotFieldEntry,
	type SnapshotRelationEntry,
} from './contract.js';

/** Files written and stale schema artifacts removed by a snapshot write. */
export type WriteResult = ArtifactWriteResult;

/** Controls which collections a scoped snapshot write may replace or remove. */
export interface WriteScope {
	/** Whether a collection is inside the pull scope and may be replaced or removed. */
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

interface SchemaMetadata {
	readonly files: string[];
	readonly snapshot: Record<string, unknown>;
}

const collectionFileSchema = z.object({
	collection: z.string().min(1),
	definition: z.unknown().optional(),
	fields: z.array(z.unknown()),
	systemFields: z.array(z.unknown()),
	relations: z.array(z.unknown()),
});

const metadataSchema = z.object({
	snapshot: z.custom<Record<string, unknown>>(isPlainObject),
});

function byField(a: SnapshotFieldEntry, b: SnapshotFieldEntry): number {
	return byCodepoint(a.field, b.field);
}

function byRelation(a: SnapshotRelationEntry, b: SnapshotRelationEntry): number {
	return byCodepoint(a.field, b.field) || byCodepoint(a.related_collection ?? '', b.related_collection ?? '');
}

function header(snapshot: Snapshot, files: string[]): SchemaMetadata {
	const {
		collections: _collections,
		fields: _fields,
		systemFields: _systemFields,
		relations: _relations,
		...rest
	} = snapshot;

	return { files, snapshot: rest };
}

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

function parseCollectionFile(value: unknown, name: string): RawCollectionFile {
	if (!isPlainObject(value)) throw new CliError('STATE', `${name} is not a schema file.`);

	const result = collectionFileSchema.safeParse(value);

	if (!result.success) {
		const field = result.error.issues[0]?.path[0];

		if (field === 'collection') {
			throw new CliError('STATE', `${name} is missing a valid "collection" name.`);
		}

		if (field === 'fields' || field === 'systemFields' || field === 'relations') {
			throw new CliError('STATE', `${name} has a missing or non-array "${field}".`, {
				detail: z.prettifyError(result.error),
			});
		}

		throw new CliError('STATE', `${name} is not a schema file.`, { detail: z.prettifyError(result.error) });
	}

	return {
		collection: result.data.collection,
		definition: result.data.definition ?? null,
		fields: result.data.fields,
		systemFields: result.data.systemFields,
		relations: result.data.relations,
	};
}

function parseMetadata(value: unknown): { snapshot: Record<string, unknown> } {
	const result = metadataSchema.safeParse(value);

	if (!result.success) {
		throw new CliError('STATE', `${METADATA_FILE} is missing a valid "snapshot" header.`, {
			detail: z.prettifyError(result.error),
		});
	}

	return result.data;
}

function previousVersion(value: unknown): number | undefined {
	const parsed = metadataSchema.safeParse(value);
	if (!parsed.success) return undefined;

	const version = parsed.data.snapshot['version'];
	return typeof version === 'number' ? version : undefined;
}

/** Write a snapshot as deterministic, manifest-owned collection artifacts. */
export function writeSnapshotFiles(dir: string, snapshot: Snapshot, scope?: WriteScope): WriteResult {
	const manifestHint = 'Fix or delete the schema directory, then run d6s sync pull again.';

	return writeArtifacts({
		dir,
		artifacts: collectionFiles(snapshot),
		body: (file) => file,
		manifestHint,
		metadata: ({ files, preserved, previousMetadata }) => {
			const metadata = header(snapshot, files);

			// Metadata describes the assembled artifact set, not only this response. Preserving files from a
			// prior full set must preserve its full tag or a later mirror diff could delete omitted collections.
			if (scope !== undefined && preserved.length > 0 && previousVersion(previousMetadata) === SNAPSHOT_FULL) {
				metadata.snapshot['version'] = SNAPSHOT_FULL;
			}

			return metadata;
		},
		...(scope === undefined
			? {}
			: {
					preserve: { parse: parseCollectionFile, when: (file: RawCollectionFile) => !scope.inScope(file.collection) },
				}),
	});
}

/** Read and reassemble a validated snapshot from its committed artifacts. */
export function readSnapshotFiles(dir: string): Snapshot {
	const { metadata, artifacts: files } = readArtifacts({
		dir,
		kind: 'schema',
		missing: `No schema snapshot found in ${dir}.`,
		missingHint: 'Run d6s sync pull first.',
		parseMetadata,
		parseArtifact: parseCollectionFile,
	});

	const collections: unknown[] = [];
	const fields: unknown[] = [];
	const systemFields: unknown[] = [];
	const relations: unknown[] = [];

	for (const file of files) {
		if (file.definition !== null) collections.push(file.definition);
		fields.push(...file.fields);
		systemFields.push(...file.systemFields);
		relations.push(...file.relations);
	}

	const assembled = { ...metadata.snapshot, collections, fields, systemFields, relations };

	try {
		return parseSnapshot(assembled);
	} catch (error) {
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
