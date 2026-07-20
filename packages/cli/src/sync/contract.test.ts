import { describe, expect, it } from 'vitest';
import { CliError } from '../kernel/error.js';
import { parseDiffResult, parseImportResult, parseSnapshot, SNAPSHOT_PARTIAL } from './contract.js';

function fullSnapshot(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		version: 1,
		directus: '11.0.0',
		vendor: 'postgres',
		collections: [{ collection: 'articles', meta: { note: null } }],
		fields: [{ collection: 'articles', field: 'title', type: 'string' }],
		systemFields: [],
		relations: [],
		...overrides,
	};
}

describe('parseSnapshot', () => {
	it('fails loud, naming systemFields, when it is absent rather than forging an empty array', () => {
		// Absence is not emptiness: an empty array is a real statement ("no indexed system-field
		// state"), so a missing key must fail at the boundary naming the field, never default to [].
		const { systemFields: _systemFields, ...withoutSystemFields } = fullSnapshot();

		let error: unknown;

		try {
			parseSnapshot(withoutSystemFields);
		} catch (caught) {
			error = caught;
		}

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('HTTP');
		expect((error as CliError).detail).toMatch(/systemFields/i);
	});

	it('fails loud, naming version, on a version the CLI cannot process', () => {
		// Only 1 (full) and 2 (partial) are known; an unknown future version must not be processed
		// under a snapshot format the CLI does not understand.
		let error: unknown;

		try {
			parseSnapshot(fullSnapshot({ version: 3 }));
		} catch (caught) {
			error = caught;
		}

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('HTTP');
		expect((error as CliError).detail).toMatch(/version/i);
	});

	it('preserves unknown entry keys so an API that adds fields does not lose data on round-trip', () => {
		// The CLI stores and forwards snapshot entries verbatim; validating only
		// `collection` must not strip the rest of the object.
		const parsed = parseSnapshot(
			fullSnapshot({ collections: [{ collection: 'articles', schema: { name: 'articles' } }] }),
		);

		expect(parsed.collections[0]).toMatchObject({ collection: 'articles', schema: { name: 'articles' } });
	});

	it('carries the partial version tag through, since scope safety downstream keys off it', () => {
		const parsed = parseSnapshot(fullSnapshot({ version: SNAPSHOT_PARTIAL }));

		expect(parsed.version).toBe(SNAPSHOT_PARTIAL);
	});

	it('fails loud at the boundary, naming the field, when the shape drifts', () => {
		// A drifted response must not flow downstream as a plausible-looking object; the
		// error names the offending path so a contract break is diagnosable at the call.
		let error: unknown;

		try {
			parseSnapshot(fullSnapshot({ collections: [{ meta: {} }] }));
		} catch (caught) {
			error = caught;
		}

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('HTTP');
		expect((error as CliError).detail).toMatch(/collection/i);
	});
});

describe('parseImportResult', () => {
	it('surfaces the per-collection id remap intact, the reconcile state the CLI must persist', () => {
		const parsed = parseImportResult({
			applied: false,
			mode: 'add',
			collections: {
				articles: { existing: [], new: [1, 2], deleted: [], mapped: { '10': 1, '11': 2 } },
			},
		});

		expect(parsed.applied).toBe(false);
		expect(parsed.collections['articles']?.mapped).toEqual({ '10': 1, '11': 2 });
	});
});

describe('parseDiffResult', () => {
	it('parses the sealed hash and the opaque diff body', () => {
		const parsed = parseDiffResult({ hash: 'abc123', diff: { collections: [], fields: [], relations: [] } });

		expect(parsed?.hash).toBe('abc123');
	});

	it('reads a 204 no-body diff as null, the "no changes" outcome, not a drift', () => {
		// /schema/diff answers 204 with no body when the snapshots already match; that absent body
		// must read as "no changes" rather than failing the parse.
		expect(parseDiffResult(undefined)).toBeNull();
	});
});
