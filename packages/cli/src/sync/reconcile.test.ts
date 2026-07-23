import { describe, expect, it } from 'vitest';
import { CliError } from '../kernel/error.js';
import { type CollectionReconcile, reconcileCollections, type ReconcileInput } from './reconcile.js';

function forCollection(results: readonly CollectionReconcile[], name: string): CollectionReconcile {
	const found = results.find((result) => result.collection === name);
	if (found === undefined) throw new Error(`no result for ${name}`);
	return found;
}

function expectCliError(fn: () => unknown): CliError {
	try {
		fn();
	} catch (error) {
		expect(error).toBeInstanceOf(CliError);
		return error as CliError;
	}

	throw new Error('expected a CliError');
}

describe('reconcileCollections', () => {
	it('matches a unique natural key and seeds that pair', () => {
		// The base case reconcile exists for: two instances gave one role different IDs; without this match a
		// merge import would create a second "Editor" instead of updating the first.
		const results = reconcileCollections(
			[
				{
					collection: 'directus_roles',
					primaryKey: 'id',
					sourceRecords: [{ id: 's1', name: 'Editor' }],
					targetRecords: [{ id: 't1', name: 'Editor' }],
				},
			],
			{},
		);

		const roles = forCollection(results, 'directus_roles');

		expect(roles.matched).toEqual([{ sourceId: 's1', targetId: 't1', key: JSON.stringify(['Editor']) }]);
		expect(roles.ambiguous).toEqual([]);
		expect(roles.unmatched).toEqual([]);
	});

	it('marks a source ambiguous when two targets share its key', () => {
		// mirror-delete safety: two target "Editor" rows mean the match is genuinely undecidable; guessing one
		// would seed a wrong ID and let a later mirror delete destroy the other real record.
		const results = reconcileCollections(
			[
				{
					collection: 'directus_roles',
					primaryKey: 'id',
					sourceRecords: [{ id: 's1', name: 'Editor' }],
					targetRecords: [
						{ id: 't2', name: 'Editor' },
						{ id: 't1', name: 'Editor' },
					],
				},
			],
			{},
		);

		const roles = forCollection(results, 'directus_roles');

		expect(roles.matched).toEqual([]);
		expect(roles.ambiguous).toEqual([{ sourceId: 's1', key: JSON.stringify(['Editor']), targetIds: ['t1', 't2'] }]);
		expect(roles.unmatched).toEqual([]);
	});

	it('marks both sources ambiguous when two of them collide on one target', () => {
		// The mirror image of target-side ambiguity: two source rows want the single "Dup" target and neither
		// can claim it, so both must stop for a human rather than one silently winning.
		const results = reconcileCollections(
			[
				{
					collection: 'directus_roles',
					primaryKey: 'id',
					sourceRecords: [
						{ id: 's2', name: 'Dup' },
						{ id: 's1', name: 'Dup' },
					],
					targetRecords: [{ id: 't1', name: 'Dup' }],
				},
			],
			{},
		);

		const roles = forCollection(results, 'directus_roles');

		expect(roles.matched).toEqual([]);

		expect(roles.ambiguous).toEqual([
			{ sourceId: 's1', key: JSON.stringify(['Dup']), targetIds: ['t1'] },
			{ sourceId: 's2', key: JSON.stringify(['Dup']), targetIds: ['t1'] },
		]);
	});

	it('skips a source already in the map and never re-offers its claimed target', () => {
		// The committed map wins: s1 is already mapped, so it appears in no bucket, and its target t1 is
		// claimed — so a second source with the same name cannot be matched onto it and would only duplicate.
		const results = reconcileCollections(
			[
				{
					collection: 'directus_roles',
					primaryKey: 'id',
					sourceRecords: [
						{ id: 's1', name: 'Admin' },
						{ id: 's2', name: 'Admin' },
					],
					targetRecords: [{ id: 't1', name: 'Admin' }],
				},
			],
			{ directus_roles: { s1: 't1' } },
		);

		const roles = forCollection(results, 'directus_roles');

		expect(roles.matched).toEqual([]);
		expect(roles.ambiguous).toEqual([]);
		expect(roles.unmatched).toEqual(['s2']);
	});

	it('translates an FK key component through a parent matched earlier in the run', () => {
		// Operations key on flow+key, and flow is an FK: the operation can only match once its flow has a
		// target-space ID. Inputs come parents-first; an operation whose flow never matched cannot equal any
		// target row and must land unmatched, not be paired by an untranslated source ID.
		const results = reconcileCollections(
			[
				{
					collection: 'directus_flows',
					primaryKey: 'id',
					sourceRecords: [{ id: 'fS', name: 'MyFlow' }],
					targetRecords: [{ id: 'fT', name: 'MyFlow' }],
				},
				{
					collection: 'directus_operations',
					primaryKey: 'id',
					sourceRecords: [
						{ id: 'oS', flow: 'fS', key: 'trigger' },
						{ id: 'oOrphan', flow: 'fUnknown', key: 'x' },
					],
					targetRecords: [{ id: 'oT', flow: 'fT', key: 'trigger' }],
				},
			],
			{},
		);

		expect(forCollection(results, 'directus_flows').matched).toEqual([
			{ sourceId: 'fS', targetId: 'fT', key: JSON.stringify(['MyFlow']) },
		]);

		const operations = forCollection(results, 'directus_operations');

		expect(operations.matched).toEqual([{ sourceId: 'oS', targetId: 'oT', key: JSON.stringify(['fT', 'trigger']) }]);
		expect(operations.unmatched).toEqual(['oOrphan']);
	});

	it('does not cross-match access rows whose null FK component sits in a different slot', () => {
		// access rows key on role+user+policy, one of role/user always null. A role-set/user-null row and a
		// null-role/user-set row must never collide, or reconcile would seed a policy grant onto the wrong
		// principal — the directus-sync #148 data-loss class.
		const results = reconcileCollections(
			[
				{
					collection: 'directus_roles',
					primaryKey: 'id',
					sourceRecords: [{ id: 'rS', name: 'R' }],
					targetRecords: [{ id: 'rT', name: 'R' }],
				},
				{
					collection: 'directus_users',
					primaryKey: 'id',
					sourceRecords: [{ id: 'uS', email: 'u@example.com' }],
					targetRecords: [{ id: 'uT', email: 'u@example.com' }],
				},
				{
					collection: 'directus_policies',
					primaryKey: 'id',
					sourceRecords: [{ id: 'pS', name: 'P' }],
					targetRecords: [{ id: 'pT', name: 'P' }],
				},
				{
					collection: 'directus_access',
					primaryKey: 'id',
					sourceRecords: [
						{ id: 'aRole', role: 'rS', user: null, policy: 'pS' },
						{ id: 'aUser', role: null, user: 'uS', policy: 'pS' },
					],
					targetRecords: [
						{ id: 'aRoleT', role: 'rT', user: null, policy: 'pT' },
						{ id: 'aUserT', role: null, user: 'uT', policy: 'pT' },
					],
				},
			],
			{},
		);

		const access = forCollection(results, 'directus_access');

		expect(access.matched).toEqual([
			{ sourceId: 'aRole', targetId: 'aRoleT', key: JSON.stringify(['rT', null, 'pT']) },
			{ sourceId: 'aUser', targetId: 'aUserT', key: JSON.stringify([null, 'uT', 'pT']) },
		]);

		expect(access.ambiguous).toEqual([]);
		expect(access.unmatched).toEqual([]);
	});

	it('normalizes an integer primary key to its string form', () => {
		// settings ids are integers; the seeded map is keyed by strings, so a match must record '1', not 1,
		// or the later import would look up the mapping under the wrong key type and miss it.
		const results = reconcileCollections(
			[
				{
					collection: 'directus_settings',
					primaryKey: 'id',
					sourceRecords: [{ id: 1, project_name: 'X' }],
					targetRecords: [{ id: 1, project_name: 'X' }],
				},
			],
			{},
		);

		expect(forCollection(results, 'directus_settings').matched).toEqual([{ sourceId: '1', targetId: '1', key: '[]' }]);
	});

	it('matches the settings singleton unconditionally despite different ids and content', () => {
		// settings is one row per instance with no natural key; the singleton must pair regardless of field
		// values, or a first push would create a second settings row the server rejects.
		const results = reconcileCollections(
			[
				{
					collection: 'directus_settings',
					primaryKey: 'id',
					sourceRecords: [{ id: 5, project_name: 'Alpha' }],
					targetRecords: [{ id: 9, project_name: 'Beta' }],
				},
			],
			{},
		);

		expect(forCollection(results, 'directus_settings').matched).toEqual([{ sourceId: '5', targetId: '9', key: '[]' }]);
	});

	it('fails STATE naming a collection with no natural-key entry', () => {
		// Table drift must be loud: a collection reconcile does not know how to key must halt, not silently
		// report everything unmatched and let a later mirror delete wipe real target records.
		const error = expectCliError(() =>
			reconcileCollections(
				[{ collection: 'directus_mystery', primaryKey: 'id', sourceRecords: [], targetRecords: [] }],
				{},
			),
		);

		expect(error.code).toBe('STATE');
		expect(error.message).toContain('directus_mystery');
	});

	it('produces identical output when record order is shuffled', () => {
		// The committed seed and any diff derived from it must depend only on the records, not their export
		// order; a reshuffle that changed the result would make reconcile non-reproducible in review and CI.
		const base: ReconcileInput[] = [
			{
				collection: 'directus_roles',
				primaryKey: 'id',
				sourceRecords: [
					{ id: 'r1', name: 'Alpha' },
					{ id: 'r2', name: 'Dup' },
					{ id: 'r3', name: 'Dup' },
					{ id: 'r4', name: 'Ghost' },
				],
				targetRecords: [
					{ id: 't1', name: 'Alpha' },
					{ id: 't2', name: 'Dup' },
				],
			},
			{
				collection: 'directus_operations',
				primaryKey: 'id',
				sourceRecords: [{ id: 'o1', flow: 'f1', key: 'run' }],
				targetRecords: [{ id: 'oT', flow: 'f1', key: 'run' }],
			},
		];

		const reversed = base.map((input) => ({
			...input,
			sourceRecords: [...input.sourceRecords].reverse(),
			targetRecords: [...input.targetRecords].reverse(),
		}));

		expect(reconcileCollections(reversed, {})).toEqual(reconcileCollections(base, {}));
	});
});
