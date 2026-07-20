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

function diffBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		collections: [
			{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events', schema: { name: 'events' } } }] },
		],
		fields: [
			{
				collection: 'articles',
				field: 'title',
				diff: [{ kind: 'E', path: ['meta', 'note'], lhs: null, rhs: 'headline' }],
			},
			{
				collection: 'articles',
				field: 'old_slug',
				diff: [{ kind: 'D', lhs: { collection: 'articles', field: 'old_slug', type: 'string' } }],
			},
		],
		systemFields: [],
		relations: [],
		...overrides,
	};
}

function diffResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
	return { hash: 'abc123', diff: diffBody(), ...overrides };
}

describe('parseDiffResult', () => {
	it('parses the sealed hash and the typed diff across the four change kinds', () => {
		const parsed = parseDiffResult(diffResult());

		expect(parsed?.hash).toBe('abc123');
		expect(parsed?.diff.collections[0]?.collection).toBe('events');
		expect(parsed?.diff.fields[0]?.diff[0]?.kind).toBe('E');
		expect(parsed?.diff.systemFields).toEqual([]);
	});

	it('preserves op bodies verbatim — lhs, rhs, and unknown keys — so /schema/apply gets exactly what /schema/diff returned', () => {
		// The CLI forwards this diff to /schema/apply untouched; validating only kind/path must not
		// strip the op body, or apply would receive a different change than diff computed.
		const op = { kind: 'E', path: ['meta', 'note'], lhs: 'was', rhs: 'now', index: 2, extra: { deep: true } };

		const parsed = parseDiffResult(
			diffResult({ diff: diffBody({ fields: [{ collection: 'articles', field: 'title', diff: [op] }] }) }),
		);

		expect(parsed?.diff.fields[0]?.diff[0]).toEqual(op);
	});

	it('fails loud, naming the offending kind, on an op kind the CLI cannot classify', () => {
		// An unknown op kind is a deep-diff/protocol change; forwarding it to /schema/apply blind could
		// apply a change the CLI never understood, so it must fail at the boundary naming the path.
		let error: unknown;

		try {
			parseDiffResult(
				diffResult({ diff: diffBody({ collections: [{ collection: 'events', diff: [{ kind: 'X' }] }] }) }),
			);
		} catch (caught) {
			error = caught;
		}

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('HTTP');
		expect((error as CliError).detail).toMatch(/kind/i);
	});

	it('fails loud, naming the missing array, when the server omits one of the four (absence is not emptiness)', () => {
		// The server always emits all four arrays; a missing one is a protocol break, not "no relation
		// changes", so it must fail naming the field rather than defaulting to [].
		const { relations: _relations, ...withoutRelations } = diffBody();

		let error: unknown;

		try {
			parseDiffResult({ hash: 'abc123', diff: withoutRelations });
		} catch (caught) {
			error = caught;
		}

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('HTTP');
		expect((error as CliError).detail).toMatch(/relations/i);
	});

	it('reads a 204 no-body diff as null, the "no changes" outcome, not a drift', () => {
		// /schema/diff answers 204 with no body when the snapshots already match; that absent body
		// must read as "no changes" rather than failing the parse.
		expect(parseDiffResult(undefined)).toBeNull();
	});
});
