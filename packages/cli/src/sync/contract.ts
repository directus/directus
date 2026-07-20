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
// and forwards it, and reads `version` only to know whether a snapshot is scoped. Only
// these two values parse: an unknown future version fails loud rather than being
// processed under a snapshot format the CLI does not understand.
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

// A relation always carries collection/field/related_collection (see api sanitizeRelation, which
// picks all three; related_collection is nullable — an m2a relation has no single target). The rest
// (meta, schema) passes through verbatim. Typed so the store can sort by these keys without coercion.
export interface SnapshotRelationEntry {
	collection: string;
	field: string;
	related_collection: string | null;
	[key: string]: unknown;
}

// The index signature keeps the CLI's verbatim promise at the top level too: a future server-side
// key the CLI does not model must round-trip through store and diff, never be silently stripped.
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

// The diff body mirrors the API's SnapshotDiff (packages/types): four arrays of changed
// items, each carrying deep-diff `diff` ops the CLI renders and forwards to /schema/apply
// but never authors. The op BODIES (lhs/rhs/index/…) stay opaque and pass through verbatim,
// but the addressing keys (collection/field/related_collection) and the op `kind` ARE
// validated here, because rendering and gating key off them — an unknown kind is a
// deep-diff/protocol change the CLI must not forward blind. `hash` seals the diff against
// the target. The server answers 204 with no body when the snapshots match, so "no changes"
// is modeled as a `null` result rather than a DiffResult (see parseDiffResult).
export interface DiffOp {
	kind: 'N' | 'D' | 'E' | 'A';
	path?: (string | number)[];
	[key: string]: unknown;
}

export interface DiffEntry {
	collection: string;
	diff: DiffOp[];
	[key: string]: unknown;
}

export interface DiffFieldEntry {
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

export interface DiffResult {
	hash: string;
	diff: SchemaDiff;
}

const snapshotEntrySchema = z.looseObject({ collection: z.string() });
const snapshotFieldSchema = z.looseObject({ collection: z.string(), field: z.string() });

// Relations get their own schema, not the generic entry schema: the server always emits
// related_collection (nullable), and the diff path already keys off it, so require exactly the three
// keys sanitizeRelation always picks and leave the rest loose.
const snapshotRelationSchema = z.looseObject({
	collection: z.string(),
	field: z.string(),
	related_collection: z.string().nullable(),
});

// Loose at the top level so unknown server-side keys survive the parse (z.object would strip them),
// preserving the verbatim promise the store and diff both rely on.
const snapshotSchema = z.looseObject({
	// Only the two known versions parse; a future version tag must fail loud, not flow through.
	version: z.union([z.literal(SNAPSHOT_FULL), z.literal(SNAPSHOT_PARTIAL)]),
	directus: z.string(),
	vendor: z.string(),
	collections: z.array(snapshotEntrySchema),
	fields: z.array(snapshotFieldSchema),
	// Required, never defaulted: the API always emits systemFields, and an empty array is a real
	// statement ("no indexed system-field state") that a defaulted missing key would forge.
	systemFields: z.array(snapshotFieldSchema),
	relations: z.array(snapshotRelationSchema),
});

const diffOpSchema = z.looseObject({
	// The strict enum is the gate: an unknown kind is a deep-diff/protocol change the CLI must
	// not forward to /schema/apply blind. Everything else on the op (lhs/rhs/index/…) is opaque.
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
	// All four arrays required (same absence-is-not-emptiness stance as the snapshot): the server
	// always emits every array, so a missing one is a protocol break, not "no changes of that kind".
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

export function parseDiffResult(value: unknown): DiffResult | null {
	// The accepted "no changes" values are exactly what the SDK maps a legitimate 204 to (see
	// extractData: a 204 returns null) — nothing more. An empty-string body is NOT that: it is a
	// malformed 200, and treating it as "no changes" would hide a broken response, so `''` falls
	// through to the parse and fails loud like any other bad shape.
	if (value === null) return null;

	// zod infers an optional key as `T | undefined`; DiffOp.path is exact-optional (`T?`, never an
	// explicit undefined). The wire only ever omits the key, so narrow to the public shape here.
	return parseResponse(diffResultSchema, value, 'schema diff') as DiffResult;
}

export function parseImportResult(value: unknown): ImportBatchResult {
	return parseResponse(importResultSchema, value, 'data import');
}

export type { ImportBatchResult, ImportCollectionData };
