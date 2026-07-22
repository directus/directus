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
import { CliError, withHint } from '../kernel/error.js';
import {
	type DiffResult,
	type ImportBatchResult,
	type ImportCollectionData,
	parseDiffResult,
	parseImportResult,
	parseSnapshot,
	type Snapshot,
} from './contract.js';

/**
 * A snapshot scope that makes include/exclude mutually exclusive by construction.
 */
export type SnapshotScope = { readonly include: string[] } | { readonly exclude: string[] };

// The CLI is schema-agnostic, while the SDK expects collection literals from a typed schema. Contain that
// mismatch at the wire boundary.
function snapshotOptions(scope: SnapshotScope): SchemaSnapshotOptions<CoreSchema> {
	if ('include' in scope) return { includeCollections: scope.include as AllCollections<CoreSchema>[] };
	return { excludeCollections: scope.exclude as AllCollections<CoreSchema>[] };
}

export async function fetchSnapshot(credential: ResolvedCredential, scope?: SnapshotScope): Promise<Snapshot> {
	const client = connect(credential);

	let response: unknown;

	try {
		// Omit options for a full snapshot; the server alone owns the returned version tag.
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
		// Preserve the server-issued hash seal and contain the SDK's broad diff typing at the wire boundary.
		// `force` is intentionally unavailable because it bypasses drift detection.
		await client.request(schemaApply({ hash: result.hash, diff: result.diff as SchemaDiffOutput['diff'] }));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}
}

/**
 * One collection's data pull: a system endpoint (/roles) or a user-collection endpoint (/items/articles),
 * plus the primary key the export keys on and whether the endpoint is a singleton (settings).
 */
export interface RecordSource {
	readonly collection: string;
	readonly endpoint: string;
	readonly primaryKey: string;
	readonly singleton: boolean;
}

/**
 * Fetch system or content records. The envelope and record object shape are validated, while collection-
 * specific fields pass through unchanged.
 */
export async function fetchRecords(
	credential: ResolvedCredential,
	source: RecordSource,
): Promise<Record<string, unknown>[]> {
	const client = connect(credential);

	if (source.singleton) {
		let response: unknown;

		try {
			response = await client.request(() => ({ path: source.endpoint, method: 'GET', params: {} }));
		} catch (error) {
			throw mapRequestError(error, credential.url);
		}

		if (!isPlainObject(response)) {
			throw new CliError('HTTP', `The ${source.endpoint} response was not a settings object.`);
		}

		return [response as Record<string, unknown>];
	}

	// QUERY_LIMIT_MAX can silently clamp limit=-1, and a short page is indistinguishable from a clamped one.
	// Continue until an empty page so mirror never mistakes a truncated fetch for the complete collection.
	const records: Record<string, unknown>[] = [];

	for (;;) {
		const offset = records.length;

		let response: unknown;

		try {
			response = await client.request(() => ({
				path: source.endpoint,
				method: 'GET',
				params: { limit: -1, sort: source.primaryKey, ...(offset === 0 ? {} : { offset }) },
			}));
		} catch (error) {
			throw mapRequestError(error, credential.url);
		}

		if (!Array.isArray(response) || !response.every((record) => isPlainObject(record))) {
			throw new CliError('HTTP', `The ${source.endpoint} response was not an array of records.`);
		}

		if (response.length === 0) {
			// An empty FIRST page is ambiguous: a genuinely empty collection, or QUERY_LIMIT_MAX=0 — the
			// server accepts a zero cap (sanitize-query checks `>= 0`) and clamps limit=-1 to zero rows,
			// which reads exactly like emptiness. Mirror would turn that into "delete every target row",
			// so the two must be split: validate-query rejects any explicit limit above the cap, so a
			// limit=1 probe answers 400 on a zero-cap instance and 200 on a healthy one.
			if (records.length === 0) {
				try {
					await client.request(() => ({
						path: source.endpoint,
						method: 'GET',
						params: { limit: 1, sort: source.primaryKey },
					}));
				} catch (error) {
					throw new CliError(
						'CONFIG',
						`The instance rejected a limit=1 read of ${source.endpoint} after an empty limit=-1 read — QUERY_LIMIT_MAX is 0, so every list reads as empty.`,
						{
							hint: 'A zero row cap would export empty collections and let a mirror push delete real target rows. Fix QUERY_LIMIT_MAX on the instance, then re-run.',
							detail: mapRequestError(error, credential.url).message,
						},
					);
				}
			}

			return records;
		}

		records.push(...(response as Record<string, unknown>[]));
	}
}

/**
 * The import options the batch endpoint understands. mode is ALWAYS sent (the server defaults to `add`,
 * so an omitted mode silently changes semantics); dryRun and dangerouslyAllowDelete ride only when set,
 * so the query string carries exactly the flags the CLI chose and stays deterministic for assertions.
 */
export interface ImportBatchInput {
	readonly mode: 'add' | 'merge';
	readonly dryRun?: boolean;
	readonly dangerouslyAllowDelete?: boolean;
}

// Import-specific extensions are optional; shape drift falls back to the generic mapped error.
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

// Add actionable context for import failures whose raw server messages do not identify the remedy.
function enrichImportError(mapped: CliError, error: unknown): CliError {
	const extensions = importErrorExtensions(error);

	if (extensions === undefined) return mapped;

	if (extensions['code'] === 'IMPORT_CYCLICAL_RELATION') {
		return new CliError(mapped.code, mapped.message, {
			hint: 'A relation in the cycle must be nullable so the importer can defer it.',
			detail: renderCycle(extensions),
		});
	}

	return withHint(
		mapped,
		'A referenced record is missing on the target — an out-of-scope reference or an unsynced dependency.',
	);
}

/**
 * Import a flat record batch as the JSON multipart file required by `/utils/import`, validating the
 * response and enriching actionable import failures at the boundary.
 */
export async function importBatch(
	credential: ResolvedCredential,
	batch: ImportCollectionData[],
	options: ImportBatchInput,
): Promise<ImportBatchResult> {
	const client = connect(credential);

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
