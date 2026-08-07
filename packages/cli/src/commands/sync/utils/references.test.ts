import { describe, expect, it } from 'vitest';
import type { Snapshot } from './contract.js';
import {
	findOutOfScopeReferences,
	findSplitRelations,
	formatOutOfScopeReferences,
	formatSplitRelations,
} from './references.js';

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

	it('ignores references that are present, system-owned, or targetless', () => {
		const references = findOutOfScopeReferences(
			snapshot({
				collections: [
					{ collection: 'website', meta: { group: null } },
					{ collection: 'pages', meta: { group: 'website' } },
				],
				relations: [
					{ collection: 'pages', field: 'site', related_collection: 'website' },
					{ collection: 'pages', field: 'owner', related_collection: 'directus_users' },
					{ collection: 'pages', field: 'translations', related_collection: null },
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

	it('sorts output deterministically so warnings do not depend on snapshot entry order', () => {
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

describe('findSplitRelations', () => {
	it('flags a relation whose paired field is not in the snapshot, because the partner file is stale', () => {
		const splits = findSplitRelations(
			snapshot({
				collections: [{ collection: 'articles' }, { collection: 'authors' }],
				fields: [
					{ collection: 'articles', field: 'author', type: 'uuid' },
					{ collection: 'authors', field: 'name', type: 'string' },
				],
				relations: [
					{ collection: 'articles', field: 'author', related_collection: 'authors', meta: { one_field: 'articles' } },
				],
			}),
		);

		expect(splits).toEqual([
			{
				kind: 'relation',
				from: 'articles.author',
				fromCollection: 'articles',
				relatedCollection: 'authors',
				pairedField: 'authors.articles',
			},
		]);
	});

	it('flags a relational alias field with no relation behind it — the same tear from the other side', () => {
		const splits = findSplitRelations(
			snapshot({
				collections: [{ collection: 'authors' }],
				fields: [{ collection: 'authors', field: 'articles', type: 'alias', meta: { special: ['o2m'] } }],
			}),
		);

		expect(splits).toEqual([{ kind: 'alias', from: 'authors.articles', special: 'o2m' }]);
	});

	it('stays quiet when both halves are present', () => {
		const splits = findSplitRelations(
			snapshot({
				collections: [{ collection: 'articles' }, { collection: 'authors' }],
				fields: [
					{ collection: 'articles', field: 'author', type: 'uuid' },
					{ collection: 'authors', field: 'articles', type: 'alias', meta: { special: ['o2m'] } },
				],
				relations: [
					{ collection: 'articles', field: 'author', related_collection: 'authors', meta: { one_field: 'articles' } },
				],
			}),
		);

		expect(splits).toEqual([]);
	});

	it('ignores relations without a paired field and non-relational specials', () => {
		const splits = findSplitRelations(
			snapshot({
				collections: [{ collection: 'articles' }, { collection: 'authors' }],
				fields: [
					{ collection: 'articles', field: 'author', type: 'uuid', meta: { special: ['m2o'] } },
					{ collection: 'articles', field: 'divider', type: 'alias', meta: { special: ['alias', 'no-data'] } },
				],
				relations: [
					{ collection: 'articles', field: 'author', related_collection: 'authors', meta: { one_field: null } },
				],
			}),
		);

		expect(splits).toEqual([]);
	});

	it('leaves a fully absent related collection to the out-of-scope warning', () => {
		const splits = findSplitRelations(
			snapshot({
				collections: [{ collection: 'articles' }],
				fields: [{ collection: 'articles', field: 'author', type: 'uuid' }],
				relations: [
					{ collection: 'articles', field: 'author', related_collection: 'authors', meta: { one_field: 'articles' } },
				],
			}),
		);

		expect(splits).toEqual([]);
	});

	it('checks pairs reaching into system collections, whose custom fields travel in the snapshot', () => {
		const splits = findSplitRelations(
			snapshot({
				collections: [{ collection: 'articles' }],
				fields: [{ collection: 'articles', field: 'owner', type: 'uuid' }],
				relations: [
					{
						collection: 'articles',
						field: 'owner',
						related_collection: 'directus_users',
						meta: { one_field: 'articles' },
					},
				],
			}),
		);

		expect(splits).toEqual([
			{
				kind: 'relation',
				from: 'articles.owner',
				fromCollection: 'articles',
				relatedCollection: 'directus_users',
				pairedField: 'directus_users.articles',
			},
		]);
	});

	it('flags an m2m alias whose junction is out of scope, since its relation rides in the junction file', () => {
		const splits = findSplitRelations(
			snapshot({
				collections: [{ collection: 'articles' }],
				fields: [{ collection: 'articles', field: 'tags', type: 'alias', meta: { special: ['m2m'] } }],
			}),
		);

		expect(splits).toEqual([{ kind: 'alias', from: 'articles.tags', special: 'm2m' }]);
	});

	it('sorts output deterministically so warnings do not depend on snapshot entry order', () => {
		const splits = findSplitRelations(
			snapshot({
				collections: [{ collection: 'zeta' }, { collection: 'alpha' }],
				fields: [{ collection: 'zeta', field: 'items', type: 'alias', meta: { special: ['o2m'] } }],
				relations: [
					{ collection: 'alpha', field: 'parent', related_collection: 'zeta', meta: { one_field: 'children' } },
				],
			}),
		);

		expect(splits.map((split) => split.from)).toEqual(['alpha.parent', 'zeta.items']);
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

describe('formatSplitRelations', () => {
	it('shows the literal --collections fix when every missing half has a known home', () => {
		const message = formatSplitRelations([
			{
				kind: 'relation',
				from: 'articles.author',
				fromCollection: 'articles',
				relatedCollection: 'authors',
				pairedField: 'authors.articles',
			},
			{
				kind: 'relation',
				from: 'articles.tags',
				fromCollection: 'articles',
				relatedCollection: 'tags',
				pairedField: 'tags.tagged',
			},
		]);

		expect(message).toContain(
			'This sync is missing half of 2 relations. Pushing it leaves those relations broken on the target:',
		);

		expect(message).toContain('articles.author → authors: the corresponding field authors.articles is not in the sync');
		expect(message).toContain('Fix: pull with --collections articles,authors,tags');
	});

	it('falls back to a full pull when an alias cannot name the file its relation lives in', () => {
		const message = formatSplitRelations([{ kind: 'alias', from: 'authors.articles', special: 'o2m' }]);

		expect(message).toContain(
			'This sync is missing half of 1 relation. Pushing it leaves that relation broken on the target:',
		);

		expect(message).toContain('authors.articles (o2m): the relation that defines it is not in the sync');
		expect(message).toContain('Fix: pull the full schema (drop --collections)');
	});
});
