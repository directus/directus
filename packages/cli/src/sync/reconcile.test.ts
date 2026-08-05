import { describe, expect, it } from 'vitest';
import { type CollectionReconcile, reconcileCollections, type ReconcileInput } from './reconcile.js';
import { allResources } from './resources.js';

function input(
	collection: string,
	sourceRecords: Record<string, unknown>[],
	targetRecords: Record<string, unknown>[],
): ReconcileInput {
	const resource = allResources().find((entry) => entry.collection === collection);

	if (resource?.naturalKey === undefined) throw new Error(`no natural key for ${collection}`);

	return {
		collection,
		primaryKey: resource.primaryKey,
		naturalKey: resource.naturalKey,
		fkFields: resource.fkFields,
		sourceRecords,
		targetRecords,
	};
}

function forCollection(results: readonly CollectionReconcile[], name: string): CollectionReconcile {
	const found = results.find((result) => result.collection === name);
	if (found === undefined) throw new Error(`no result for ${name}`);
	return found;
}

describe('reconcileCollections', () => {
	it('matches a unique natural key and seeds that pair', () => {
		const results = reconcileCollections(
			[input('directus_roles', [{ id: 's1', name: 'Editor' }], [{ id: 't1', name: 'Editor' }])],
			{},
		);

		const roles = forCollection(results, 'directus_roles');

		expect(roles.matched).toEqual([{ sourceId: 's1', targetId: 't1', key: JSON.stringify(['Editor']) }]);
		expect(roles.ambiguous).toEqual([]);
		expect(roles.unmatched).toEqual([]);
	});

	it('marks a source ambiguous when two targets share its key', () => {
		const results = reconcileCollections(
			[
				input(
					'directus_roles',
					[{ id: 's1', name: 'Editor' }],
					[
						{ id: 't2', name: 'Editor' },
						{ id: 't1', name: 'Editor' },
					],
				),
			],
			{},
		);

		const roles = forCollection(results, 'directus_roles');

		expect(roles.matched).toEqual([]);
		expect(roles.ambiguous).toEqual([{ sourceId: 's1', key: JSON.stringify(['Editor']), targetIds: ['t1', 't2'] }]);
		expect(roles.unmatched).toEqual([]);
	});

	it('marks both sources ambiguous when two of them collide on one target', () => {
		const results = reconcileCollections(
			[
				input(
					'directus_roles',
					[
						{ id: 's2', name: 'Dup' },
						{ id: 's1', name: 'Dup' },
					],
					[{ id: 't1', name: 'Dup' }],
				),
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
		const results = reconcileCollections(
			[
				input(
					'directus_roles',
					[
						{ id: 's1', name: 'Admin' },
						{ id: 's2', name: 'Admin' },
					],
					[{ id: 't1', name: 'Admin' }],
				),
			],
			{ directus_roles: { s1: 't1' } },
		);

		const roles = forCollection(results, 'directus_roles');

		expect(roles.matched).toEqual([]);
		expect(roles.ambiguous).toEqual([]);
		expect(roles.unmatched).toEqual(['s2']);
	});

	it('translates an FK key component through a parent matched earlier in the run', () => {
		const results = reconcileCollections(
			[
				input('directus_flows', [{ id: 'fS', name: 'MyFlow' }], [{ id: 'fT', name: 'MyFlow' }]),
				input(
					'directus_operations',
					[
						{ id: 'oS', flow: 'fS', key: 'trigger' },
						{ id: 'oOrphan', flow: 'fUnknown', key: 'x' },
					],
					[{ id: 'oT', flow: 'fT', key: 'trigger' }],
				),
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
		const results = reconcileCollections(
			[
				input('directus_roles', [{ id: 'rS', name: 'R' }], [{ id: 'rT', name: 'R' }]),
				input('directus_users', [{ id: 'uS', email: 'u@example.com' }], [{ id: 'uT', email: 'u@example.com' }]),
				input('directus_policies', [{ id: 'pS', name: 'P' }], [{ id: 'pT', name: 'P' }]),
				input(
					'directus_access',
					[
						{ id: 'aRole', role: 'rS', user: null, policy: 'pS' },
						{ id: 'aUser', role: null, user: 'uS', policy: 'pS' },
					],
					[
						{ id: 'aRoleT', role: 'rT', user: null, policy: 'pT' },
						{ id: 'aUserT', role: null, user: 'uT', policy: 'pT' },
					],
				),
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

	it('matches the settings singleton despite different content and normalizes its numeric ids', () => {
		const results = reconcileCollections(
			[input('directus_settings', [{ id: 5, project_name: 'Alpha' }], [{ id: 9, project_name: 'Beta' }])],
			{},
		);

		expect(forCollection(results, 'directus_settings').matched).toEqual([{ sourceId: '5', targetId: '9', key: '[]' }]);
	});

	it('produces identical output when record order is shuffled', () => {
		const base: ReconcileInput[] = [
			input(
				'directus_roles',
				[
					{ id: 'r1', name: 'Alpha' },
					{ id: 'r2', name: 'Dup' },
					{ id: 'r3', name: 'Dup' },
					{ id: 'r4', name: 'Ghost' },
				],
				[
					{ id: 't1', name: 'Alpha' },
					{ id: 't2', name: 'Dup' },
				],
			),
			input('directus_operations', [{ id: 'o1', flow: 'f1', key: 'run' }], [{ id: 'oT', flow: 'f1', key: 'run' }]),
		];

		const reversed = base.map((entry) => ({
			...entry,
			sourceRecords: [...entry.sourceRecords].reverse(),
			targetRecords: [...entry.targetRecords].reverse(),
		}));

		expect(reconcileCollections(reversed, {})).toEqual(reconcileCollections(base, {}));
	});
});
