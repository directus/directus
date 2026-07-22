import {
	type AllCollections,
	type CoreSchema,
	isDirectusError,
	schemaApply,
	schemaDiff,
	type SchemaDiffOutput,
	schemaSnapshot,
	type SchemaSnapshotOptions,
	utilsImportBatch,
} from '@directus/sdk';
import { isPlainObject } from 'lodash-es';
import type { ResolvedCredential } from '../kernel/config/credentials.js';
import { connect, mapRequestError } from '../kernel/connection.js';
import { CliError } from '../kernel/error.js';
import {
	type DiffResult,
	type ImportBatchResult,
	type ImportCollectionData,
	parseDiffResult,
	parseImportResult,
	parseSnapshot,
	type Snapshot,
} from './contract.js';

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

// One collection's data pull: a system endpoint (/roles) or a user-collection endpoint (/items/articles),
// plus the primary key the export keys on and whether the endpoint is a singleton (settings).
export interface RecordSource {
	readonly collection: string; // e.g. 'directus_roles' or 'articles'
	readonly endpoint: string; // '/roles' or '/items/articles'
	readonly primaryKey: string;
	readonly singleton: boolean;
}

// Pull one collection's records verbatim. Unlike snapshot/diff these are the user's own content, so they
// are NOT parsed against a contract — only the envelope is validated so a broken response fails loud at
// the seam rather than corrupting the export: a list must be an array of plain objects, a singleton one
// plain object, otherwise HTTP naming the endpoint.
export async function fetchRecords(
	credential: ResolvedCredential,
	source: RecordSource,
): Promise<Record<string, unknown>[]> {
	const client = connect(credential);

	let response: unknown;

	try {
		// A hand-rolled RestCommand (the SDK's customEndpoint form): a bare thunk returning RequestOptions.
		// limit -1 pulls the whole collection and sort keys it by the primary key so the fetch order is
		// stable; a singleton endpoint returns one object, so limit/sort do not apply and are omitted.
		response = await client.request(() => ({
			path: source.endpoint,
			method: 'GET',
			params: source.singleton ? {} : { limit: -1, sort: source.primaryKey },
		}));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}

	if (source.singleton) {
		if (!isPlainObject(response)) {
			throw new CliError('HTTP', `The ${source.endpoint} response was not a settings object.`);
		}

		return [response as Record<string, unknown>];
	}

	if (!Array.isArray(response) || !response.every((record) => isPlainObject(record))) {
		throw new CliError('HTTP', `The ${source.endpoint} response was not an array of records.`);
	}

	return response as Record<string, unknown>[];
}

// The import options the batch endpoint understands. mode is ALWAYS sent (the server defaults to `add`,
// so an omitted mode silently changes semantics); dryRun and dangerouslyAllowDelete ride only when set,
// so the query string carries exactly the flags the CLI chose and stays deterministic for assertions.
export interface ImportBatchInput {
	readonly mode: 'add' | 'merge';
	readonly dryRun?: boolean;
	readonly dangerouslyAllowDelete?: boolean;
}

// The extensions the server attaches to an import failure the CLI can explain: the cyclical-relation
// error carries the cycle it found, any other carries just its code. Dug out the same way
// mapRequestError reads the code, so a shape drift degrades to the generic mapped error rather than
// throwing here.
function importErrorExtensions(error: unknown): Record<string, unknown> | undefined {
	if (!isDirectusError(error)) return undefined;

	for (const entry of error.errors) {
		const extensions = entry.extensions;

		if (isPlainObject(extensions)) {
			const code = (extensions as Record<string, unknown>)['code'];

			if (code === 'IMPORT_CYCLICAL_RELATION' || code === 'INVALID_FOREIGN_KEY') {
				return extensions as Record<string, unknown>;
			}
		}
	}

	return undefined;
}

// Render the cycle the server reported into a single detail line: the collections that form it and the
// non-nullable relations holding it together (`collection.field → related`). Values are stringified
// defensively — this is failure-path presentation, not a validated contract.
function renderCycle(extensions: Record<string, unknown>): string {
	const collections = Array.isArray(extensions['collections']) ? (extensions['collections'] as unknown[]) : [];
	const relations = Array.isArray(extensions['relations']) ? (extensions['relations'] as unknown[]) : [];

	const relationText = relations
		.filter((relation): relation is Record<string, unknown> => isPlainObject(relation))
		.map(
			(relation) => `${String(relation['collection'])}.${String(relation['field'])} → ${String(relation['related'])}`,
		)
		.join(', ');

	const collectionText = collections.map((name) => String(name)).join(', ');
	const suffix = relationText === '' ? '' : `; non-nullable relations: ${relationText}`;

	return `Cycle among ${collectionText}${suffix}.`;
}

// Turn a mapped import failure into one that explains the two import-specific failure modes push cannot
// otherwise diagnose. A cyclical relation names the cycle and points at the fix (make one relation
// nullable); a missing foreign key points at the likely cause (an out-of-scope reference or an unsynced
// dependency). Any other error passes through as mapRequestError left it.
function enrichImportError(mapped: CliError, error: unknown): CliError {
	const extensions = importErrorExtensions(error);

	if (extensions === undefined) return mapped;

	if (extensions['code'] === 'IMPORT_CYCLICAL_RELATION') {
		return new CliError(mapped.code, mapped.message, {
			hint: 'A relation in the cycle must be nullable so the importer can defer it.',
			detail: renderCycle(extensions),
		});
	}

	return new CliError(mapped.code, mapped.message, {
		hint: 'A referenced record is missing on the target — an out-of-scope reference or an unsynced dependency.',
		...(mapped.detail !== undefined ? { detail: mapped.detail } : {}),
	});
}

// Import a flat batch of records through POST /utils/import. The payload is a multipart FILE upload: a
// single JSON file whose content is the `[{collection, items}]` array (the server reads the first file
// part regardless of field name and requires its mimetype to be application/json — see api
// read-file-upload-body.ts and read-multipart-file.ts). Node's native FormData/Blob build it; the SDK
// strips the placeholder multipart Content-Type so fetch sets the boundary. The response is parsed at
// the boundary; a cyclical-relation or missing-FK failure is enriched here so push stays presentational.
export async function importBatch(
	credential: ResolvedCredential,
	batch: ImportCollectionData[],
	options: ImportBatchInput,
): Promise<ImportBatchResult> {
	const client = connect(credential);

	// Only defined flags reach the params, so mode always rides and dryRun/dangerouslyAllowDelete appear
	// exactly when true — a clean, deterministic query string.
	const params = {
		mode: options.mode,
		...(options.dryRun === true ? { dryRun: true } : {}),
		...(options.dangerouslyAllowDelete === true ? { dangerouslyAllowDelete: true } : {}),
	};

	const file = new Blob([JSON.stringify(batch)], { type: 'application/json' });
	const form = new FormData();
	form.append('file', file, 'import.json');

	let response: unknown;

	try {
		response = await client.request(utilsImportBatch(form, params));
	} catch (error) {
		throw enrichImportError(mapRequestError(error, credential.url), error);
	}

	return parseImportResult(response);
}
