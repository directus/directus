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
import type { PrimaryKey } from '@directus/types';
import { get, isPlainObject } from 'lodash-es';
import type { ResolvedCredential } from '../../../kernel/config/credentials.js';
import type { ImportMode, SchemaDiffMode } from '../../../kernel/config/mode.js';
import { connect, mapRequestError } from '../../../kernel/connection.js';
import { CliError, withHint } from '../../../kernel/error.js';
import {
	type DiffResult,
	type ImportBatchResult,
	type ImportCollectionData,
	parseDiffResult,
	parseImportResult,
	parseSnapshot,
	type Snapshot,
} from './contract.js';
import { SYNC_MIN_DIRECTUS } from './preflight.js';

export type SnapshotScope = { readonly include: string[] } | { readonly exclude: string[] };

// The SDK types collections as literals; the CLI is schema-agnostic. Keep the cast at this one boundary.
function snapshotOptions(scope: SnapshotScope): SchemaSnapshotOptions<CoreSchema> {
	if ('include' in scope) return { includeCollections: scope.include as AllCollections<CoreSchema>[] };
	return { excludeCollections: scope.exclude as AllCollections<CoreSchema>[] };
}

export async function fetchSnapshot(credential: ResolvedCredential, scope?: SnapshotScope): Promise<Snapshot> {
	const client = connect(credential);

	let response: unknown;

	try {
		response = await client.request(scope === undefined ? schemaSnapshot() : schemaSnapshot(snapshotOptions(scope)));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}

	return parseSnapshot(response);
}

export async function fetchDiff(
	credential: ResolvedCredential,
	snapshot: Snapshot,
	mode: SchemaDiffMode,
	force = false,
): Promise<DiffResult | null> {
	const client = connect(credential);

	let response: unknown;

	// Always send a mode: the server's own default is the destructive mirror.
	try {
		response = await client.request(schemaDiff(snapshot, force ? { mode, force: true } : { mode }));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}

	return parseDiffResult(response);
}

export async function applyDiff(credential: ResolvedCredential, result: DiffResult): Promise<void> {
	const client = connect(credential);

	try {
		// No force here: the server-issued hash already seals the diff.
		await client.request(schemaApply({ hash: result.hash, diff: result.diff as SchemaDiffOutput['diff'] }));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}
}

/** One GET /fields entry, trimmed to what secret detection reads. `meta` is null without a directus_fields row. */
export interface FieldCatalogEntry {
	readonly collection: string;
	readonly field: string;
	readonly meta: Record<string, unknown> | null;
}

/**
 * GET /fields ignores query params and never paginates, so one request names every field of every
 * collection — including system collections a scoped snapshot omits.
 */
export async function fetchFields(credential: ResolvedCredential): Promise<FieldCatalogEntry[]> {
	const client = connect(credential);

	let response: unknown;

	try {
		response = await client.request(() => ({ path: '/fields', method: 'GET', params: {} }));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}

	if (!Array.isArray(response) || !response.every((entry) => isPlainObject(entry))) {
		throw new CliError('HTTP', 'The /fields response was not an array of field entries.');
	}

	return (response as Record<string, unknown>[]).map((entry) => {
		const collection = entry['collection'];
		const field = entry['field'];

		if (typeof collection !== 'string' || typeof field !== 'string') {
			throw new CliError('HTTP', 'A /fields entry lacks its collection or field name.');
		}

		const meta = entry['meta'];

		return { collection, field, meta: isPlainObject(meta) ? (meta as Record<string, unknown>) : null };
	});
}

interface RecordSource {
	readonly endpoint: string;
	readonly primaryKey: string;
	readonly singleton: boolean;
	/** Server-derived rows to discard before validation and paging. */
	readonly drop?: ((record: Record<string, unknown>) => boolean) | undefined;
	/** Page by PK cursor instead of offset. Integer PKs only — _gt is forbidden on uuid fields. */
	readonly keyset?: boolean | undefined;
}

function asRecordArray(response: unknown, source: RecordSource): Record<string, unknown>[] {
	if (!Array.isArray(response) || !response.every((record) => isPlainObject(record))) {
		throw new CliError('HTTP', `The ${source.endpoint} response was not an array of records.`);
	}

	const records = response as Record<string, unknown>[];
	const drop = source.drop;
	return drop === undefined ? records : records.filter((record) => !drop(record));
}

function requirePrimaryKey(record: Record<string, unknown>, source: RecordSource): PrimaryKey {
	const primaryKey = record[source.primaryKey];

	if (typeof primaryKey !== 'string' && typeof primaryKey !== 'number') {
		throw new CliError('HTTP', `A ${source.endpoint} record has no "${source.primaryKey}" primary key.`, {
			hint: 'Field permissions may hide the primary-key field; records cannot be keyed without it.',
		});
	}

	return primaryKey;
}

function trackPrimaryKey(
	record: Record<string, unknown>,
	source: RecordSource,
	seen: Set<string>,
	duplicateHint: string,
): PrimaryKey {
	const value = requirePrimaryKey(record, source);
	const key = String(value);

	if (seen.has(key)) {
		throw new CliError('HTTP', `${source.endpoint} returned primary key "${key}" more than once.`, {
			hint: duplicateHint,
		});
	}

	seen.add(key);
	return value;
}

// A zero query cap makes a populated collection look empty; a limit=1 read tells the two apart.
async function refuseZeroCapEmptiness(
	client: ReturnType<typeof connect>,
	credential: ResolvedCredential,
	source: RecordSource,
): Promise<void> {
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
				hint: 'A zero-record limit would pull empty collections and let a mirror push delete real target records. Fix QUERY_LIMIT_MAX on the instance, then re-run.',
				detail: mapRequestError(error, credential.url).message,
			},
		);
	}
}

// With an unknown cap, one returned record could be a real singleton or QUERY_LIMIT_MAX=1 truncation.
async function refuseOneCapTruncation(
	client: ReturnType<typeof connect>,
	credential: ResolvedCredential,
	source: RecordSource,
): Promise<void> {
	try {
		await client.request(() => ({
			path: source.endpoint,
			method: 'GET',
			params: { limit: 2, sort: source.primaryKey },
		}));
	} catch (error) {
		throw new CliError(
			'CONFIG',
			`The instance rejected a limit=2 read of ${source.endpoint} after paging concluded at one record — QUERY_LIMIT_MAX is 1, so every list truncates after its first record.`,
			{
				hint: 'A one-record limit truncates every pull and would let a mirror push delete real target records. Raise QUERY_LIMIT_MAX on the instance, then re-run.',
				detail: mapRequestError(error, credential.url).message,
			},
		);
	}
}

// Offsets drift when server-side filtering hides records after pagination; a PK cursor does not.
async function fetchKeysetPages(
	client: ReturnType<typeof connect>,
	credential: ResolvedCredential,
	source: RecordSource,
): Promise<Record<string, unknown>[]> {
	const records: Record<string, unknown>[] = [];
	const seen = new Set<string>();
	let cursor: PrimaryKey | undefined;

	while (true) {
		let response: unknown;

		try {
			response = await client.request(() => ({
				path: source.endpoint,
				method: 'GET',
				params: {
					limit: -1,
					sort: source.primaryKey,
					...(cursor === undefined ? {} : { filter: { [source.primaryKey]: { _gt: cursor } } }),
				},
			}));
		} catch (error) {
			throw mapRequestError(error, credential.url);
		}

		const rows = asRecordArray(response, source);

		if (rows.length === 0) {
			if (cursor === undefined) await refuseZeroCapEmptiness(client, credential, source);
			return records;
		}

		for (const record of rows) {
			const value = trackPrimaryKey(
				record,
				source,
				seen,
				'The server did not honor the cursor filter; pages cannot be trusted.',
			);

			// The raw value, not its string form: the filter must compare in the field's own type.
			cursor = value;
		}

		records.push(...rows);
	}
}

// An unbounded instance cannot clamp limit=-1, so one read is exhaustive.
async function fetchUnbounded(
	client: ReturnType<typeof connect>,
	credential: ResolvedCredential,
	source: RecordSource,
): Promise<Record<string, unknown>[]> {
	let response: unknown;

	try {
		response = await client.request(() => ({
			path: source.endpoint,
			method: 'GET',
			params: { limit: -1, sort: source.primaryKey },
		}));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}

	const rows = asRecordArray(response, source);

	const seen = new Set<string>();

	for (const record of rows) {
		trackPrimaryKey(
			record,
			source,
			seen,
			'The server returned a duplicate primary key in one read; pages cannot be trusted.',
		);
	}

	return rows;
}

/** `queryMax` is the instance's `queryLimit.max`: -1 reads once, anything else (including unknown) pages. */
export async function fetchRecords(
	credential: ResolvedCredential,
	source: RecordSource,
	queryMax?: number,
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

		const record = response as Record<string, unknown>;
		requirePrimaryKey(record, source);

		return [record];
	}

	if (queryMax === -1) return fetchUnbounded(client, credential, source);

	if (source.keyset === true) return fetchKeysetPages(client, credential, source);

	if (queryMax === 1) {
		throw new CliError(
			'CONFIG',
			`QUERY_LIMIT_MAX is 1 on the instance — paging cannot advance past the first ${source.endpoint} record.`,
			{
				hint: 'A one-record limit truncates every pull and would let a mirror push delete real target records. Raise QUERY_LIMIT_MAX on the instance, then re-run.',
			},
		);
	}

	// QUERY_LIMIT_MAX may silently clamp limit=-1, so page until a response proves exhaustion. Pages overlap
	// by one record to catch a boundary that shifts mid-fetch.
	const records: Record<string, unknown>[] = [];
	const seen = new Set<string>();
	let last: string | undefined;

	while (true) {
		const offset = records.length === 0 ? undefined : records.length - 1;

		let response: unknown;

		try {
			response = await client.request(() => ({
				path: source.endpoint,
				method: 'GET',
				params: { limit: -1, sort: source.primaryKey, ...(offset === undefined ? {} : { offset }) },
			}));
		} catch (error) {
			throw mapRequestError(error, credential.url);
		}

		const rows = asRecordArray(response, source);

		if (offset === undefined && rows.length === 0) {
			await refuseZeroCapEmptiness(client, credential, source);
			return records;
		}

		let fresh = rows;

		if (offset !== undefined) {
			const overlapPk = rows[0]?.[source.primaryKey];

			if (overlapPk === undefined || String(overlapPk) !== last) {
				throw new CliError('HTTP', `${source.endpoint} shifted while paging — the overlap record changed.`, {
					hint: 'Concurrent writes moved the pages mid-fetch; re-run the command.',
				});
			}

			fresh = rows.slice(1);

			if (fresh.length === 0) {
				if (records.length === 1 && queryMax === undefined) {
					await refuseOneCapTruncation(client, credential, source);
				}

				return records;
			}
		}

		for (const record of fresh) {
			last = String(trackPrimaryKey(record, source, seen, 'Unstable pages mid-fetch; re-run the command.'));
		}

		records.push(...fresh);
	}
}

/** Mode is required: an omitted mode silently means `add` on the server. */
interface ImportBatchInput {
	readonly mode: ImportMode;
	readonly dryRun?: boolean;
	readonly dangerouslyAllowDelete?: boolean;
}

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

function formatCycle(extensions: Record<string, unknown>): string {
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

function enrichImportError(mapped: CliError, error: unknown): CliError {
	if (!isDirectusError(error)) {
		return withHint(
			mapped,
			'The push may still have been applied on the server. Run d6s sync diff before retrying — a blind retry can duplicate records.',
		);
	}

	// Only a route-level 404 means the endpoint itself is missing; any other 404 keeps its own story.
	if (get(error.response, 'status') === 404 && error.errors[0]?.extensions.code === 'ROUTE_NOT_FOUND') {
		return withHint(
			mapped,
			`The batch import endpoint was not found — the target may be running Directus older than ${SYNC_MIN_DIRECTUS}, which Environment Sync requires.`,
		);
	}

	const extensions = importErrorExtensions(error);

	if (extensions === undefined) return mapped;

	if (extensions['code'] === 'IMPORT_CYCLICAL_RELATION') {
		return new CliError(mapped.code, mapped.message, {
			hint: 'A relation in the cycle must be nullable so the importer can defer it.',
			detail: formatCycle(extensions),
		});
	}

	return withHint(
		mapped,
		'A referenced record is missing on the target — an out-of-scope reference or an unsynced dependency.',
	);
}

// A client abort does not stop the server transaction, so wait far longer than a normal request.
const IMPORT_TIMEOUT_MS = 600_000;

/** Sent as a file, not a JSON body: the body path is capped by MAX_PAYLOAD_SIZE, far below IMPORT_MAX_FILE_SIZE. */
export async function importBatch(
	credential: ResolvedCredential,
	batch: ImportCollectionData[],
	options: ImportBatchInput,
): Promise<ImportBatchResult> {
	const client = connect(credential, { timeoutMs: IMPORT_TIMEOUT_MS });

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
