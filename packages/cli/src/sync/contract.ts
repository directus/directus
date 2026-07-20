import type { ImportBatchResult, ImportCollectionData } from '@directus/types';
import { z } from 'zod';
import { CliError } from '../kernel/error.js';

// The single source of truth for every request/response shape the CLI exchanges with
// the API. Responses are validated at the boundary (parse, not trust-cast), so a shape
// drift fails loudly at the call site — naming the field that moved — instead of
// surfacing as a mystery downstream. The zod schemas stay module-private
// (isolatedDeclarations can't emit a declaration for a zod-derived const); the exported
// types and parsers are the public surface. Import types come from @directus/types,
// which types them properly; the snapshot/diff types are owned here (see below).

// Snapshot version tags (mirror the API's SNAPSHOT_VERSION): 1 = a full instance
// snapshot, 2 = a partial, collection-scoped one. The distinction is load-bearing on
// the server — a full snapshot diffed in `mirror` mode proposes deleting every
// collection it omits — so the CLI never fabricates or edits it: it parses, stores,
// and forwards it, and reads `version` only to know whether a snapshot is scoped.
export const SNAPSHOT_FULL = 1;
export const SNAPSHOT_PARTIAL = 2;

// Snapshot types are owned here rather than reused from the SDK: the SDK's
// `SchemaSnapshotOutput` types collections/fields/relations as `Record<string, any>`
// (stubbed, `// TODO improve typing`), which would erase the type of the very keys the
// CLI groups and renders by. We keep the fields we read typed and pass the rest through
// verbatim. Arrays stay mutable so a snapshot can be handed straight back to the SDK's
// diff/apply commands.
export interface SnapshotEntry {
	collection: string;
	[key: string]: unknown;
}

export interface SnapshotFieldEntry {
	collection: string;
	field: string;
	[key: string]: unknown;
}

export interface Snapshot {
	version: number;
	directus: string;
	vendor: string;
	collections: SnapshotEntry[];
	fields: SnapshotFieldEntry[];
	systemFields: SnapshotFieldEntry[];
	relations: SnapshotEntry[];
}

// The diff body is deep-diff output the CLI renders and forwards to /schema/apply but
// never authors, so it stays an opaque object; `hash` seals it against the target.
export interface DiffResult {
	hash: string;
	diff: Record<string, unknown>;
}

const snapshotEntrySchema = z.looseObject({ collection: z.string() });
const snapshotFieldSchema = z.looseObject({ collection: z.string(), field: z.string() });

const snapshotSchema = z.object({
	version: z.number(),
	directus: z.string(),
	vendor: z.string(),
	collections: z.array(snapshotEntrySchema),
	fields: z.array(snapshotFieldSchema),
	systemFields: z.array(snapshotFieldSchema).default([]),
	relations: z.array(snapshotEntrySchema),
});

const diffResultSchema = z.object({
	hash: z.string(),
	diff: z.record(z.string(), z.unknown()),
});

const primaryKey = z.union([z.string(), z.number()]);

const importCollectionResultSchema = z.object({
	existing: z.array(primaryKey),
	new: z.array(primaryKey),
	deleted: z.array(primaryKey),
	// old → new primary key: the reconcile record the CLI must persist as sync state,
	// or a re-run re-inserts instead of matching.
	mapped: z.record(z.string(), primaryKey),
});

const importResultSchema = z.object({
	applied: z.boolean(),
	mode: z.enum(['add', 'merge']),
	collections: z.record(z.string(), importCollectionResultSchema),
});

// A response that doesn't match the agreed shape is a protocol break, not a user
// error — surface exactly which field drifted rather than failing downstream.
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

export function parseDiffResult(value: unknown): DiffResult {
	return parseResponse(diffResultSchema, value, 'schema diff');
}

export function parseImportResult(value: unknown): ImportBatchResult {
	return parseResponse(importResultSchema, value, 'data import');
}

export type { ImportBatchResult, ImportCollectionData };
