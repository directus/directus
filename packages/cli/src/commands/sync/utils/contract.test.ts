import { describe, expect, it } from 'vitest';
import { CliError } from '../../../kernel/error.js';
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

	it('fails loud, naming the path, when a relation omits its always-emitted related_collection', () => {
		let error: unknown;

		try {
			parseSnapshot(fullSnapshot({ relations: [{ collection: 'articles', field: 'author' }] }));
		} catch (caught) {
			error = caught;
		}

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('HTTP');
		expect((error as CliError).detail).toMatch(/related_collection/i);
	});

	it('parses a relation whose related_collection is null, the many-to-any case with no single target', () => {
		const parsed = parseSnapshot(
			fullSnapshot({ relations: [{ collection: 'articles', field: 'item', related_collection: null }] }),
		);

		expect(parsed.relations[0]?.related_collection).toBeNull();
	});

	it('preserves an unknown top-level snapshot key so a future server-side key is not stripped', () => {
		const parsed = parseSnapshot(fullSnapshot({ foo: { bar: 1 } }));

		expect(parsed['foo']).toEqual({ bar: 1 });
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
	it('parses the sealed hash and all four diff sections', () => {
		const parsed = parseDiffResult(diffResult());

		expect(parsed?.hash).toBe('abc123');
		expect(parsed?.diff.collections[0]?.collection).toBe('events');
		expect(parsed?.diff.fields[0]?.diff[0]?.kind).toBe('E');
		expect(parsed?.diff.systemFields).toEqual([]);
	});

	it('preserves op bodies verbatim — lhs, rhs, and unknown keys — so /schema/apply gets exactly what /schema/diff returned', () => {
		const op = { kind: 'E', path: ['meta', 'note'], lhs: 'was', rhs: 'now', index: 2, extra: { deep: true } };

		const parsed = parseDiffResult(
			diffResult({ diff: diffBody({ fields: [{ collection: 'articles', field: 'title', diff: [op] }] }) }),
		);

		expect(parsed?.diff.fields[0]?.diff[0]).toEqual(op);
	});

	it('fails loud, naming the offending kind, on an op kind the CLI cannot classify', () => {
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

	it('reads the SDK 204 value as null but rejects an empty-string body as malformed', () => {
		expect(parseDiffResult(null)).toBeNull();

		let error: unknown;

		try {
			parseDiffResult('');
		} catch (caught) {
			error = caught;
		}

		expect(error).toBeInstanceOf(CliError);
		expect((error as CliError).code).toBe('HTTP');
	});
});
