import { describe, expect, it } from 'vitest';
import type { Snapshot } from './contract.js';
import { findOutOfScopeReferences, formatOutOfScopeReferences } from './references.js';

function snapshot(overrides: Partial<Snapshot> = {}): Snapshot {
	return {
		version: 2,
		directus: '11.0.0',
		vendor: 'postgres',
		collections: [],
		fields: [],
		systemFields: [],
		relations: [],
		...overrides,
	};
}

describe('findOutOfScopeReferences', () => {
	it('flags a group parent the scope omits, because apply cannot resolve the dangling nesting', () => {
		const references = findOutOfScopeReferences(
			snapshot({ collections: [{ collection: 'pages', meta: { group: 'website' } }] }),
		);

		expect(references).toEqual([{ kind: 'group', from: 'pages', missing: ['website'] }]);
	});

	it('does not flag a group parent that is included, since the nesting resolves on apply', () => {
		const references = findOutOfScopeReferences(
			snapshot({
				collections: [
					{ collection: 'website', meta: { group: null } },
					{ collection: 'pages', meta: { group: 'website' } },
				],
			}),
		);

		expect(references).toEqual([]);
	});

	it('flags an m2o relation whose target is out of scope', () => {
		const references = findOutOfScopeReferences(
			snapshot({
				collections: [{ collection: 'pages' }],
				relations: [{ collection: 'pages', field: 'author', related_collection: 'authors' }],
			}),
		);

		expect(references).toEqual([{ kind: 'relation', from: 'pages.author', missing: ['authors'] }]);
	});

	it('never flags a system collection target, because every instance already has it', () => {
		const references = findOutOfScopeReferences(
			snapshot({
				collections: [{ collection: 'pages' }],
				relations: [{ collection: 'pages', field: 'owner', related_collection: 'directus_users' }],
			}),
		);

		expect(references).toEqual([]);
	});

	it('reports only the m2a allowed collections that are missing, keeping the included ones out', () => {
		const references = findOutOfScopeReferences(
			snapshot({
				collections: [{ collection: 'pages' }, { collection: 'testimonials' }],
				relations: [
					{
						collection: 'pages',
						field: 'blocks',
						related_collection: null,
						meta: { one_allowed_collections: ['testimonials', 'hero', 'gallery'] },
					},
				],
			}),
		);

		expect(references).toEqual([{ kind: 'm2a', from: 'pages.blocks', missing: ['gallery', 'hero'] }]);
	});

	it('ignores a null-target relation with no allow-list rather than crashing', () => {
		const references = findOutOfScopeReferences(
			snapshot({
				collections: [{ collection: 'pages' }],
				relations: [{ collection: 'pages', field: 'translations', related_collection: null }],
			}),
		);

		expect(references).toEqual([]);
	});

	it('returns nothing for a full snapshot where every reference resolves internally', () => {
		const references = findOutOfScopeReferences(
			snapshot({
				collections: [
					{ collection: 'website', meta: { group: null } },
					{ collection: 'pages', meta: { group: 'website' } },
				],
				relations: [{ collection: 'pages', field: 'site', related_collection: 'website' }],
			}),
		);

		expect(references).toEqual([]);
	});

	it('sorts output deterministically so warnings do not depend on snapshot row order', () => {
		const references = findOutOfScopeReferences(
			snapshot({
				collections: [
					{ collection: 'zeta', meta: { group: 'missing_z' } },
					{ collection: 'alpha', meta: { group: 'missing_a' } },
				],
			}),
		);

		expect(references.map((reference) => reference.from)).toEqual(['alpha', 'zeta']);
	});
});

describe('formatOutOfScopeReferences', () => {
	it('leads with the distinct missing-collection count and lists each pointing site', () => {
		const message = formatOutOfScopeReferences([
			{ kind: 'group', from: 'pages', missing: ['website'] },
			{ kind: 'relation', from: 'pages.author', missing: ['authors'] },
			{ kind: 'm2a', from: 'pages.blocks', missing: ['gallery', 'hero'] },
		]);

		expect(message).toContain('references 4 collections');
		expect(message).toContain('pages → website (group parent)');
		expect(message).toContain('pages.author → authors (relation)');
		expect(message).toContain('pages.blocks → gallery, hero (m2a)');
	});
});
