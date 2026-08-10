import { DiffKind, type ImportBatchResult, type ImportCollectionData } from '@directus/types';
import { z } from 'zod';
import { CliError } from '../../../kernel/error.js';

/**
 * The API's SNAPSHOT_VERSION tags. Load-bearing: a full snapshot diffed in `mirror` mode proposes deleting
 * every collection it omits, so the CLI never fabricates or edits this value.
 */
export const SNAPSHOT_FULL = 1;

export const SNAPSHOT_PARTIAL = 2;

export interface SnapshotEntry {
	collection: string;
	[key: string]: unknown;
}

export interface SnapshotFieldEntry {
	collection: string;
	field: string;
	[key: string]: unknown;
}

/** `related_collection` is null for relations without one fixed target. */
export interface SnapshotRelationEntry {
	collection: string;
	field: string;
	related_collection: string | null;
	[key: string]: unknown;
}

/**
 * Not the `@directus/types` Snapshot: that describes one server's own structures, while the CLI talks to
 * arbitrary versions and claims only the fields it validates. It also types `version` as a plain `number`.
 */
export interface Snapshot {
	version: typeof SNAPSHOT_FULL | typeof SNAPSHOT_PARTIAL;
	directus: string;
	vendor: string;
	collections: SnapshotEntry[];
	fields: SnapshotFieldEntry[];
	systemFields: SnapshotFieldEntry[];
	relations: SnapshotRelationEntry[];
	[key: string]: unknown;
}

export interface DiffOp {
	kind: (typeof DiffKind)[keyof typeof DiffKind];
	path?: (string | number)[];
	[key: string]: unknown;
}

interface DiffEntry {
	collection: string;
	diff: DiffOp[];
	[key: string]: unknown;
}

interface DiffFieldEntry {
	collection: string;
	field: string;
	diff: DiffOp[];
	[key: string]: unknown;
}

export interface DiffRelationEntry {
	collection: string;
	field: string;
	related_collection: string | null;
	diff: DiffOp[];
	[key: string]: unknown;
}

export interface SchemaDiff {
	collections: DiffEntry[];
	fields: DiffFieldEntry[];
	systemFields: DiffFieldEntry[];
	relations: DiffRelationEntry[];
}

/** `hash` seals the diff against the target schema it was computed from. */
export interface DiffResult {
	hash: string;
	diff: SchemaDiff;
}

const snapshotEntrySchema = z.looseObject({ collection: z.string() });
const snapshotFieldSchema = z.looseObject({ collection: z.string(), field: z.string() });

const snapshotRelationSchema = z.looseObject({
	collection: z.string(),
	field: z.string(),
	related_collection: z.string().nullable(),
});

const snapshotSchema = z.looseObject({
	version: z.union([z.literal(SNAPSHOT_FULL), z.literal(SNAPSHOT_PARTIAL)]),
	directus: z.string(),
	vendor: z.string(),
	collections: z.array(snapshotEntrySchema),
	fields: z.array(snapshotFieldSchema),
	systemFields: z.array(snapshotFieldSchema),
	relations: z.array(snapshotRelationSchema),
});

const diffOpSchema = z.looseObject({
	kind: z.enum([DiffKind.NEW, DiffKind.DELETE, DiffKind.EDIT, DiffKind.ARRAY]),
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

export function parseSnapshot(value: unknown): Snapshot {
	return parseResponse(snapshotSchema, value, 'schema snapshot');
}

/** null is the SDK's representation of HTTP 204 — no diff. */
export function parseDiffResult(value: unknown): DiffResult | null {
	if (value === null) return null;

	// zod infers an optional key as `T | undefined`; DiffOp.path is exact-optional and the wire omits it.
	return parseResponse(diffResultSchema, value, 'schema diff') as DiffResult;
}

export function parseImportResult(value: unknown): ImportBatchResult {
	return parseResponse(importResultSchema, value, 'data import');
}

export type { ImportBatchResult, ImportCollectionData };
