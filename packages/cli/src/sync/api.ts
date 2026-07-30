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
	force = false,
): Promise<DiffResult | null> {
	const client = connect(credential);

	let response: unknown;

	// `mode` is required, never defaulted: the server defaults to `mirror`, whose diff proposes
	// deleting everything the snapshot omits, so every caller must choose that outcome explicitly.
	//
	// `force` bypasses the server's EXACT version/vendor equality gate on /schema/diff (validate-snapshot
	// rejects even patch drift without it). Callers pass it only after classifying the drift as patch-level
	// themselves (local-diff); apply stays hash-sealed either way, so a forced diff cannot smuggle changes
	// past target drift detection.
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
		// Preserve the server-issued hash seal and contain the SDK's broad diff typing at the wire boundary.
		// `force` is intentionally unavailable because it bypasses drift detection.
		await client.request(schemaApply({ hash: result.hash, diff: result.diff as SchemaDiffOutput['diff'] }));
	} catch (error) {
		throw mapRequestError(error, credential.url);
	}
}

/**
 * One collection's data pull: its system endpoint (/roles), the primary key the export keys on, and
 * whether the endpoint is a singleton (settings).
 */
export interface RecordSource {
	readonly collection: string;
	readonly endpoint: string;
	readonly primaryKey: string;
	readonly singleton: boolean;
	/** Rows the server derives at read time (never real records); dropped before validation and paging. */
	readonly drop?: ((record: Record<string, unknown>) => boolean) | undefined;
	/** Page by PK cursor instead of offset; integer-PK endpoints only (_gt is forbidden on uuid fields). */
	readonly keyset?: boolean | undefined;
}

// An empty FIRST page is ambiguous: a genuinely empty collection, or QUERY_LIMIT_MAX=0 — the server
// accepts a zero cap (sanitize-query checks `>= 0`) and clamps limit=-1 to zero rows, which reads exactly
// like emptiness. Mirror would turn that into "delete every target row", so the two must be split:
// validate-query rejects any explicit limit above the cap, so a limit=1 probe answers 400 on a zero-cap
// instance and 200 on a healthy one.
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
				hint: 'A zero row cap would export empty collections and let a mirror push delete real target rows. Fix QUERY_LIMIT_MAX on the instance, then re-run.',
				detail: mapRequestError(error, credential.url).message,
			},
		);
	}
}

// Keyset pages advance by PK cursor (filter PK _gt last), naming the boundary row by VALUE — so neither
// concurrent writes nor server-side row hiding can silently re-serve or skip a visible row. This exists
// because /permissions breaks the offset contract on unlicensed instances: custom-rule rows are filtered
// AFTER limit/offset (services/permissions.ts), which shifts every offset past the hidden rows and made
// the overlap check refuse deterministically. Integer-PK endpoints only; _gt is forbidden on uuid fields.
async function fetchKeysetPages(
	client: ReturnType<typeof connect>,
	credential: ResolvedCredential,
	source: RecordSource,
): Promise<Record<string, unknown>[]> {
	const records: Record<string, unknown>[] = [];
	const seen = new Set<string>();
	let cursor: string | number | undefined;

	for (;;) {
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

		if (!Array.isArray(response) || !response.every((record) => isPlainObject(record))) {
			throw new CliError('HTTP', `The ${source.endpoint} response was not an array of records.`);
		}

		// Derived rows (see RecordSource.drop) carry no primary key and are appended to every page.
		const drop = source.drop;

		const rows =
			drop === undefined
				? (response as Record<string, unknown>[])
				: (response as Record<string, unknown>[]).filter((record) => !drop(record));

		if (rows.length === 0) {
			if (cursor === undefined) await refuseZeroCapEmptiness(client, credential, source);
			return records;
		}

		for (const record of rows) {
			const pk = record[source.primaryKey];

			if (typeof pk !== 'string' && typeof pk !== 'number') {
				throw new CliError('HTTP', `A ${source.endpoint} record has no "${source.primaryKey}" primary key.`, {
					hint: 'Field permissions may hide the key column; records cannot be keyed without it.',
				});
			}

			const key = String(pk);

			// A repeat means the server ignored the cursor filter; looping on it would never terminate.
			if (seen.has(key)) {
				throw new CliError('HTTP', `${source.endpoint} returned primary key "${key}" more than once.`, {
					hint: 'The server did not honor the cursor filter; pages cannot be trusted.',
				});
			}

			seen.add(key);
			// The raw value, not its string form: the filter must compare in the column's own type.
			cursor = pk;
		}

		records.push(...rows);
	}
}

// A known-unbounded instance (queryLimit.max === -1) returns every row in a single consistent limit=-1
// read: no cap can clamp it to empty and there are no page boundaries to shift, so neither the offset
// overlap probe nor the zero-cap probe is needed. This halves the requests per resource on a standard
// instance — the paging machinery below exists only because, without the server's cap, a short page is
// indistinguishable from a clamped one.
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

	if (!Array.isArray(response) || !response.every((record) => isPlainObject(record))) {
		throw new CliError('HTTP', `The ${source.endpoint} response was not an array of records.`);
	}

	const drop = source.drop;

	const rows =
		drop === undefined
			? (response as Record<string, unknown>[])
			: (response as Record<string, unknown>[]).filter((record) => !drop(record));

	const seen = new Set<string>();

	for (const record of rows) {
		const pk = record[source.primaryKey];

		if (typeof pk !== 'string' && typeof pk !== 'number') {
			throw new CliError('HTTP', `A ${source.endpoint} record has no "${source.primaryKey}" primary key.`, {
				hint: 'Field permissions may hide the key column; records cannot be keyed without it.',
			});
		}

		const key = String(pk);

		if (seen.has(key)) {
			throw new CliError('HTTP', `${source.endpoint} returned primary key "${key}" more than once.`, {
				hint: 'The server returned a duplicate primary key in one read; pages cannot be trusted.',
			});
		}

		seen.add(key);
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
		const singletonPk = record[source.primaryKey];

		// Same boundary rule as lists: without a key, pull would write an artifact its own reader refuses.
		if (typeof singletonPk !== 'string' && typeof singletonPk !== 'number') {
			throw new CliError('HTTP', `A ${source.endpoint} record has no "${source.primaryKey}" primary key.`, {
				hint: 'Field permissions may hide the key column; records cannot be keyed without it.',
			});
		}

		return [record];
	}

	// The server told us it has no row cap, so one read is the whole collection (see fetchUnbounded).
	if (queryMax === -1) return fetchUnbounded(client, credential, source);

	if (source.keyset === true) return fetchKeysetPages(client, credential, source);

	// A one-row cap starves the overlap scheme below: the single row each follow-up page returns IS the
	// overlap row, so `fresh` is always empty and every collection reads as exhausted after row 1 — rows
	// 2..N export as absent, which a later mirror push turns into target deletions. The zero-cap probe
	// cannot see this (its limit=1 read succeeds at cap 1), so refuse the cap outright, same stance as cap 0.
	if (queryMax === 1) {
		throw new CliError(
			'CONFIG',
			`QUERY_LIMIT_MAX is 1 on the instance — paging cannot advance past the first ${source.endpoint} row.`,
			{
				hint: 'A one-row cap truncates every export and would let a mirror push delete real target rows. Raise QUERY_LIMIT_MAX on the instance, then re-run.',
			},
		);
	}

	// QUERY_LIMIT_MAX can silently clamp limit=-1, and a short page is indistinguishable from a clamped one.
	// Continue until pages are exhausted so mirror never mistakes a truncated fetch for the complete set.
	//
	// Pages advance by OFFSET WITH A ONE-ROW OVERLAP: each follow-up page starts at the last row already
	// kept, and that first row must match it. Offset pages shift under concurrent writes — an insert
	// re-serves a row, a DELETE silently skips one, and a skipped row exports as absent, which a later
	// mirror push turns into a target deletion — and a boundary shift that changes what sits at the overlap
	// offset fails loud. (Not airtight: a compensating insert+delete both landing before the boundary keeps
	// the offset stable and passes silently — that miscounts mid-fetch churn, not rows that existed
	// throughout the fetch.) Keyset paging (filter PK _gt cursor) is NOT the default: the query
	// validator forbids _gt on uuid fields (get-filter-operators-for-type.ts), which most system PKs are —
	// integer-PK endpoints opt in via `keyset` above.
	const records: Record<string, unknown>[] = [];
	const seen = new Set<string>();
	let last: string | undefined;

	for (;;) {
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

		if (!Array.isArray(response) || !response.every((record) => isPlainObject(record))) {
			throw new CliError('HTTP', `The ${source.endpoint} response was not an array of records.`);
		}

		// Server-derived rows (e.g. the app-access minimal permissions appended to every authenticated
		// /permissions read) are runtime state, not config: they carry no primary key and are appended
		// AFTER limit/offset are applied to the real rows — so they are dropped before validation,
		// excluded from the paging offset, and a page of only derived rows means the real rows are
		// exhausted.
		const drop = source.drop;

		const rows =
			drop === undefined
				? (response as Record<string, unknown>[])
				: (response as Record<string, unknown>[]).filter((record) => !drop(record));

		if (offset === undefined && rows.length === 0) {
			await refuseZeroCapEmptiness(client, credential, source);
			return records;
		}

		let fresh = rows;

		if (offset !== undefined) {
			// The overlap row is the consistency check: any concurrent insert or delete before the boundary
			// shifts what lives at this offset, and a silent shift either re-serves or SKIPS a row — a
			// skipped row exports as absent, which a later mirror push turns into a target deletion.
			const overlapPk = rows[0]?.[source.primaryKey];

			if (overlapPk === undefined || String(overlapPk) !== last) {
				throw new CliError('HTTP', `${source.endpoint} shifted while paging — the overlap row changed.`, {
					hint: 'Concurrent writes moved the pages mid-fetch; re-run the command.',
				});
			}

			fresh = rows.slice(1);

			// Only the overlap row came back: the real rows are exhausted.
			if (fresh.length === 0) return records;
		}

		// Every consumer keys on the primary key: pull writes artifacts the reader would refuse without
		// one, and reconcile/unchanged comparisons would key on the string "undefined". A missing key
		// (field permissions can hide columns) fails here, before anything is written or compared; a
		// repeated key within the fetch means the server broke its sort and pages cannot be trusted.
		for (const record of fresh) {
			const pk = record[source.primaryKey];

			if (typeof pk !== 'string' && typeof pk !== 'number') {
				throw new CliError('HTTP', `A ${source.endpoint} record has no "${source.primaryKey}" primary key.`, {
					hint: 'Field permissions may hide the key column; records cannot be keyed without it.',
				});
			}

			const key = String(pk);

			if (seen.has(key)) {
				throw new CliError('HTTP', `${source.endpoint} returned primary key "${key}" more than once.`, {
					hint: 'Unstable pages mid-fetch; re-run the command.',
				});
			}

			seen.add(key);
			last = key;
		}

		records.push(...fresh);
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
	// No server response (timeout, abort, dropped connection): aborting the request does NOT stop the
	// server's import transaction, so it may still have committed — with the id-map updates in the lost
	// response. A blind retry can duplicate records in collections with no natural key to reconcile by.
	if (!isDirectusError(error)) {
		return withHint(
			mapped,
			'The import may still have been applied on the server. Run d6s sync diff before retrying — a blind retry can duplicate records.',
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

// The server runs an import for up to its IMPORT_TIMEOUT (default 1h) inside one transaction, and a
// client-side abort does not stop that transaction — a short timeout only widens the window where the
// import commits but the response (and its id-map entries) is lost.
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
