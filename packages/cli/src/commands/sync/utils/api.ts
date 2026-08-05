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

/**
 * A snapshot scope that makes include/exclude mutually exclusive by construction.
 */
export type SnapshotScope = { readonly include: string[] } | { readonly exclude: string[] };

// Contain the schema-agnostic CLI's mismatch with the SDK's literal collection types at the wire boundary.
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

	// Never inherit the server's destructive mirror default; every caller chooses a mode explicitly.
	// Force bypasses version/vendor equality only for an explicitly consented diff; apply remains hash-sealed.
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
		// Preserve the server-issued hash seal; apply never exposes the diff's force bypass.
		await client.request(schemaApply({ hash: result.hash, diff: result.diff as SchemaDiffOutput['diff'] }));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}
}

/**
 * One entry of the admin-only GET /fields catalog: the collection/field pair and the metadata record the server
 * attached (null when the field has no directus_fields record). Only what secret detection reads is kept.
 */
export interface FieldCatalogEntry {
	readonly collection: string;
	readonly field: string;
	readonly meta: Record<string, unknown> | null;
}

/**
 * Fetch the full field catalog. GET /fields ignores query params and never paginates — FieldsService.readAll
 * reads directus_fields with an internal limit=-1 and appends the system records — so one request names every
 * field of every collection, including system collections a scoped snapshot omits entirely. Secret stripping
 * keys on this catalog, so a failure here must propagate: degrading silently would write concealed values.
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
	/** Records the server derives at read time (never stored records); dropped before validation and paging. */
	readonly drop?: ((record: Record<string, unknown>) => boolean) | undefined;
	/** Page by PK cursor instead of offset; integer-PK endpoints only (_gt is forbidden on uuid fields). */
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

function requirePrimaryKey(record: Record<string, unknown>, source: RecordSource): string | number {
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
): string | number {
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

// A zero query cap makes a populated collection look empty; an explicit limit=1 probe distinguishes it.
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

// With an unknown limit, one returned record is indistinguishable from QUERY_LIMIT_MAX=1 truncation.
// A limit=2 probe separates a real singleton from a mirror-deletion hazard.
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

// Keyset paging avoids offset drift where server-side filtering hides records after pagination.
// Only integer PKs opt in because UUID fields do not support _gt.
async function fetchKeysetPages(
	client: ReturnType<typeof connect>,
	credential: ResolvedCredential,
	source: RecordSource,
): Promise<Record<string, unknown>[]> {
	const records: Record<string, unknown>[] = [];
	const seen = new Set<string>();
	let cursor: string | number | undefined;

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

// A known-unbounded instance needs one read; paging exists only when a short response might be clamped.
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

/**
 * Fetch system or content records. The envelope and record object shape are validated, while collection-
 * specific fields pass through unchanged. `queryMax` is the instance's `queryLimit.max` (from the keystone
 * `/server/info` read): when it is -1 the fetch is a single unbounded read; otherwise, or when unknown, the
 * probe-based paging below stands.
 */
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

	// A limit below two cannot prove exhaustion safely and could turn truncated records into mirror deletions.
	if (queryMax === 1) {
		throw new CliError(
			'CONFIG',
			`QUERY_LIMIT_MAX is 1 on the instance — paging cannot advance past the first ${source.endpoint} record.`,
			{
				hint: 'A one-record limit truncates every pull and would let a mirror push delete real target records. Raise QUERY_LIMIT_MAX on the instance, then re-run.',
			},
		);
	}

	// QUERY_LIMIT_MAX may silently clamp limit=-1, so fetch until a page proves exhaustion.
	// Offset pages overlap by one record; a shifted boundary fails instead of silently skipping visible data.
	// Integer-PK resources use keyset paging because most UUID fields reject _gt.
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
			// A changed overlap means the offset boundary shifted during the fetch.
			const overlapPk = rows[0]?.[source.primaryKey];

			if (overlapPk === undefined || String(overlapPk) !== last) {
				throw new CliError('HTTP', `${source.endpoint} shifted while paging — the overlap record changed.`, {
					hint: 'Concurrent writes moved the pages mid-fetch; re-run the command.',
				});
			}

			fresh = rows.slice(1);

			// One record with an unknown cap still needs the cap-1 disambiguation probe.
			if (fresh.length === 0) {
				if (records.length === 1 && queryMax === undefined) {
					await refuseOneCapTruncation(client, credential, source);
				}

				return records;
			}
		}

		// Missing or repeated primary keys make artifacts and paging identity unsafe.
		for (const record of fresh) {
			last = String(trackPrimaryKey(record, source, seen, 'Unstable pages mid-fetch; re-run the command.'));
		}

		records.push(...fresh);
	}
}

/**
 * The import options the batch endpoint understands. mode is ALWAYS sent (the server defaults to `add`,
 * so an omitted mode silently changes semantics); dryRun and dangerouslyAllowDelete ride only when set,
 * so the query string carries exactly the flags the CLI chose and stays deterministic for assertions.
 */
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

function enrichImportError(mapped: CliError, error: unknown): CliError {
	// Losing the response does not stop the server transaction; a blind retry may duplicate records already created.
	if (!isDirectusError(error)) {
		return withHint(
			mapped,
			'The push may still have been applied on the server. Run d6s sync diff before retrying — a blind retry can duplicate records.',
		);
	}

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

// A client abort does not stop the server transaction, so use the server's long import timeout.
const IMPORT_TIMEOUT_MS = 600_000;

/**
 * Import a flat record batch as the JSON multipart file required by `/utils/import`, validating the
 * response and enriching actionable import failures at the boundary.
 */
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
