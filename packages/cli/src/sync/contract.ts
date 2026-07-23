import type { ImportBatchResult, ImportCollectionData } from '@directus/types';
import { z } from 'zod';
import { CliError } from '../kernel/error.js';

/**
 * Snapshot version tags (mirror the API's SNAPSHOT_VERSION): 1 = a full instance snapshot, 2 = a
 * partial, collection-scoped one. The distinction is load-bearing on the server — a full snapshot
 * diffed in `mirror` mode proposes deleting every collection it omits — so the CLI never fabricates
 * or edits it: it parses, stores, and forwards it, and an unknown future version fails loud rather
 * than being processed under a snapshot format the CLI does not understand.
 */
export const SNAPSHOT_FULL = 1;

/** Collection-scoped snapshot version. */
export const SNAPSHOT_PARTIAL = 2;

/** A snapshot collection entry with unknown server fields preserved. */
export interface SnapshotEntry {
	collection: string;
	[key: string]: unknown;
}

/** A snapshot field entry with unknown server fields preserved. */
export interface SnapshotFieldEntry {
	collection: string;
	field: string;
	[key: string]: unknown;
}

/**
 * A relation's sortable address. `related_collection` is null for relations without one fixed target.
 */
export interface SnapshotRelationEntry {
	collection: string;
	field: string;
	related_collection: string | null;
	[key: string]: unknown;
}

/**
 * A validated snapshot whose unknown server fields remain available for round-tripping.
 */
export interface Snapshot {
	version: 1 | 2;
	directus: string;
	vendor: string;
	collections: SnapshotEntry[];
	fields: SnapshotFieldEntry[];
	systemFields: SnapshotFieldEntry[];
	relations: SnapshotRelationEntry[];
	[key: string]: unknown;
}

/** A validated deep-diff operation with its opaque server payload preserved. */
export interface DiffOp {
	kind: 'N' | 'D' | 'E' | 'A';
	path?: (string | number)[];
	[key: string]: unknown;
}

/** A collection-level schema diff entry. */
export interface DiffEntry {
	collection: string;
	diff: DiffOp[];
	[key: string]: unknown;
}

/** A field-level schema diff entry. */
export interface DiffFieldEntry {
	collection: string;
	field: string;
	diff: DiffOp[];
	[key: string]: unknown;
}

/** A relation-level schema diff entry. */
export interface DiffRelationEntry {
	collection: string;
	field: string;
	related_collection: string | null;
	diff: DiffOp[];
	[key: string]: unknown;
}

/** The four schema diff groups returned by Directus. */
export interface SchemaDiff {
	collections: DiffEntry[];
	fields: DiffFieldEntry[];
	systemFields: DiffFieldEntry[];
	relations: DiffRelationEntry[];
}

/** A schema diff sealed against the target schema hash. */
export interface DiffResult {
	hash: string;
	diff: SchemaDiff;
}

const snapshotEntrySchema = z.looseObject({ collection: z.string() });
const snapshotFieldSchema = z.looseObject({ collection: z.string(), field: z.string() });

// Relation rendering requires the nullable related collection in addition to collection and field.
const snapshotRelationSchema = z.looseObject({
	collection: z.string(),
	field: z.string(),
	related_collection: z.string().nullable(),
});

// Loose parsing preserves unknown server fields for write/read/apply round trips.
const snapshotSchema = z.looseObject({
	version: z.union([z.literal(SNAPSHOT_FULL), z.literal(SNAPSHOT_PARTIAL)]),
	directus: z.string(),
	vendor: z.string(),
	collections: z.array(snapshotEntrySchema),
	fields: z.array(snapshotFieldSchema),
	// Missing systemFields is a protocol break; [] is meaningful state.
	systemFields: z.array(snapshotFieldSchema),
	relations: z.array(snapshotRelationSchema),
});

const diffOpSchema = z.looseObject({
	// Refuse unknown protocol operations instead of forwarding them to schema apply.
	kind: z.enum(['N', 'D', 'E', 'A']),
	path: z.array(z.union([z.string(), z.number()])).optional(),
});

const diffEntrySchema = z.looseObject({ collection: z.string(), diff: z.array(diffOpSchema) });
const diffFieldEntrySchema = z.looseObject({ collection: z.string(), field: z.string(), diff: z.array(diffOpSchema) });

const diffRelationEntrySchema = z.looseObject({
	collection: z.string(),
	field: z.string(),
	related_collection: z.string().nullable(),
	diff: z.array(diffOpSchema),
});

const schemaDiffSchema = z.object({
	collections: z.array(diffEntrySchema),
	fields: z.array(diffFieldEntrySchema),
	// Missing groups are protocol breaks, not empty change sets.
	systemFields: z.array(diffFieldEntrySchema),
	relations: z.array(diffRelationEntrySchema),
});

const diffResultSchema = z.object({
	hash: z.string(),
	diff: schemaDiffSchema,
});

const primaryKey = z.union([z.string(), z.number()]);

const importCollectionResultSchema = z.object({
	existing: z.array(primaryKey),
	new: z.array(primaryKey),
	deleted: z.array(primaryKey),
	// Persisted as sync identity so a rerun does not insert the same record again.
	mapped: z.record(z.string(), primaryKey),
});

const importResultSchema = z.object({
	applied: z.boolean(),
	mode: z.enum(['add', 'merge']),
	collections: z.record(z.string(), importCollectionResultSchema),
});

function parseResponse<T>(schema: z.ZodType<T>, value: unknown, what: string): T {
	const result = schema.safeParse(value);

	if (!result.success) {
		throw new CliError('HTTP', `The ${what} response did not match the expected shape.`, {
			detail: z.prettifyError(result.error),
		});
	}

	return result.data;
}

/** Parse a schema snapshot response, preserving unknown fields. */
export function parseSnapshot(value: unknown): Snapshot {
	return parseResponse(snapshotSchema, value, 'schema snapshot');
}

/** Parse a schema diff response; null is the SDK representation of HTTP 204. */
export function parseDiffResult(value: unknown): DiffResult | null {
	// Accept only the SDK's 204 representation; an empty 200 body remains malformed.
	if (value === null) return null;

	// zod infers an optional key as `T | undefined`; DiffOp.path is exact-optional (`T?`, never an
	// explicit undefined). The wire only ever omits the key, so narrow to the public shape here.
	return parseResponse(diffResultSchema, value, 'schema diff') as DiffResult;
}

/** Parse a data import response. */
export function parseImportResult(value: unknown): ImportBatchResult {
	return parseResponse(importResultSchema, value, 'data import');
}

export type { ImportBatchResult, ImportCollectionData };
