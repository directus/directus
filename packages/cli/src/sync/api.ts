import {
	type AllCollections,
	type CoreSchema,
	schemaApply,
	schemaDiff,
	type SchemaDiffOutput,
	schemaSnapshot,
	type SchemaSnapshotOptions,
} from '@directus/sdk';
import type { ResolvedCredential } from '../kernel/config/credentials.js';
import { connect, mapRequestError } from '../kernel/connection.js';
import { type DiffResult, parseDiffResult, parseSnapshot, type Snapshot } from './contract.js';

// The seam between the kernel connection and the sync contract: every sync API call
// gets its credential wiring, request timeout, error mapping, and boundary validation
// in one place.

// A scoped snapshot pull: exactly one of include/exclude, mutual exclusivity carried structurally so
// the caller cannot express both (the server rejects that combination, mirroring the SDK options).
export type SnapshotScope = { readonly include: string[] } | { readonly exclude: string[] };

// scope → SDK snapshot options. The SDK types include/excludeCollections as AllCollections<Schema>[] —
// collection-name literals under a typed schema. This CLI is schema-agnostic, so the scope names arrive
// as plain strings; widen them to the SDK option shape here, the one place the mismatch lives.
function snapshotOptions(scope: SnapshotScope): SchemaSnapshotOptions<CoreSchema> {
	if ('include' in scope) return { includeCollections: scope.include as AllCollections<CoreSchema>[] };
	return { excludeCollections: scope.exclude as AllCollections<CoreSchema>[] };
}

export async function fetchSnapshot(credential: ResolvedCredential, scope?: SnapshotScope): Promise<Snapshot> {
	const client = connect(credential);

	let response: unknown;

	try {
		// Omit the options entirely for a full snapshot so existing behavior is unchanged. When scoped,
		// the server tags the response `version: 2`; the CLI stores that tag exactly as returned via
		// parseSnapshot and never fabricates it.
		response = await client.request(scope === undefined ? schemaSnapshot() : schemaSnapshot(snapshotOptions(scope)));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}

	return parseSnapshot(response);
}

export async function fetchDiff(
	credential: ResolvedCredential,
	snapshot: Snapshot,
	mode: 'merge' | 'mirror',
): Promise<DiffResult | null> {
	const client = connect(credential);

	let response: unknown;

	// `mode` is required, never defaulted: the server defaults to `mirror`, whose diff proposes
	// deleting everything the snapshot omits, so every caller must choose that outcome explicitly.
	try {
		response = await client.request(schemaDiff(snapshot, { mode }));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}

	return parseDiffResult(response);
}

export async function applyDiff(credential: ResolvedCredential, result: DiffResult): Promise<void> {
	const client = connect(credential);

	try {
		// The seal reaches the wire unmodified: `hash` and `diff` are exactly what /schema/diff
		// returned, so the server re-validates that hash against its live schema and refuses on drift.
		// SchemaDiffOutput.diff is a `Record<string, any>` stub upstream (sdk src/rest/commands/schema/
		// diff.ts: `// TODO improve typing`); our SchemaDiff is precisely typed with no index signature,
		// so widen it here at the wire — the narrowest place the mismatch lives. `force` is deliberately
		// NOT exposed: it bypasses the server's hash check, and this CLI's model is sealed applies only.
		await client.request(schemaApply({ hash: result.hash, diff: result.diff as SchemaDiffOutput['diff'] }));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}
}
