import { describe, expect, it } from 'vitest';
import type { ImportBatchResult, SchemaDiff } from './contract.js';
import { summarizeDiff, summarizeImport } from './render.js';

function emptyDiff(overrides: Partial<SchemaDiff> = {}): SchemaDiff {
	return { collections: [], fields: [], systemFields: [], relations: [], ...overrides };
}

describe('summarizeDiff', () => {
	it('classifies N/D/E items into added, deleted, and modified counts — per item, not per op', () => {
		const summary = summarizeDiff(
			emptyDiff({
				collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }],
				fields: [
					{
						collection: 'articles',
						field: 'title',
						diff: [
							{ kind: 'E', path: ['meta', 'note'], lhs: null, rhs: 'headline' },
							{ kind: 'E', path: ['schema', 'default_value'], lhs: null, rhs: '' },
						],
					},
					{ collection: 'articles', field: 'old_slug', diff: [{ kind: 'D', lhs: { field: 'old_slug' } }] },
				],
			}),
		);

		expect(summary).toMatchObject({ added: 1, modified: 1, deleted: 1 });
	});

	it('marks a deletion with the loud DELETE token so the operator sees it before approving a push', () => {
		const summary = summarizeDiff(
			emptyDiff({
				fields: [{ collection: 'articles', field: 'old_slug', diff: [{ kind: 'D', lhs: { field: 'old_slug' } }] }],
			}),
		);

		expect(summary.lines).toEqual(['✖ DELETE  field articles.old_slug']);
	});

	it('names the changed paths on a modified line so the reader sees what moved', () => {
		const summary = summarizeDiff(
			emptyDiff({
				fields: [
					{
						collection: 'articles',
						field: 'title',
						diff: [{ kind: 'E', path: ['meta', 'note'], lhs: null, rhs: 'headline' }],
					},
				],
			}),
		);

		expect(summary.lines).toEqual(['~         field articles.title (meta.note)']);
	});

	it('rolls a new collection’s fields and relations into its own line instead of listing each', () => {
		const summary = summarizeDiff(
			emptyDiff({
				collections: [{ collection: 'posts', diff: [{ kind: 'N', rhs: {} }] }],
				fields: [
					{ collection: 'posts', field: 'title', diff: [{ kind: 'N', rhs: {} }] },
					{ collection: 'posts', field: 'author', diff: [{ kind: 'N', rhs: {} }] },
					{ collection: 'articles', field: 'summary', diff: [{ kind: 'N', rhs: {} }] },
				],
				relations: [
					{
						collection: 'posts',
						field: 'author',
						related_collection: 'directus_users',
						diff: [{ kind: 'N', rhs: {} }],
					},
				],
			}),
		);

		expect(summary.lines).toEqual([
			'+         collection posts (2 fields, 1 relation)',
			'+         field articles.summary',
		]);

		expect(summary).toMatchObject({ added: 5, modified: 0, deleted: 0 });
	});

	it('rolls a deleted collection’s children the same way, keeping the loud token', () => {
		const summary = summarizeDiff(
			emptyDiff({
				collections: [{ collection: 'legacy', diff: [{ kind: 'D', lhs: {} }] }],
				fields: [{ collection: 'legacy', field: 'title', diff: [{ kind: 'D', lhs: {} }] }],
			}),
		);

		expect(summary.lines).toEqual(['✖ DELETE  collection legacy (1 field)']);
		expect(summary).toMatchObject({ added: 0, modified: 0, deleted: 2 });
	});

	it('groups collections → fields → systemFields → relations and codepoint-sorts within each group', () => {
		const summary = summarizeDiff(
			emptyDiff({
				collections: [
					{ collection: 'zebras', diff: [{ kind: 'N', rhs: {} }] },
					{ collection: 'apples', diff: [{ kind: 'N', rhs: {} }] },
				],
				fields: [{ collection: 'articles', field: 'title', diff: [{ kind: 'N', rhs: {} }] }],
				systemFields: [{ collection: 'directus_users', field: 'bio', diff: [{ kind: 'N', rhs: {} }] }],
				relations: [
					{
						collection: 'articles',
						field: 'author',
						related_collection: 'directus_users',
						diff: [{ kind: 'N', rhs: {} }],
					},
				],
			}),
		);

		expect(summary.lines).toEqual([
			'+         collection apples',
			'+         collection zebras',
			'+         field articles.title',
			'+         system field directus_users.bio',
			'+         relation articles.author → directus_users',
		]);
	});

	it('renders a relation with a null related_collection without a dangling arrow', () => {
		const summary = summarizeDiff(
			emptyDiff({
				relations: [{ collection: 'pages', field: 'blocks', related_collection: null, diff: [{ kind: 'N', rhs: {} }] }],
			}),
		);

		expect(summary.lines).toEqual(['+         relation pages.blocks']);
	});

	it('returns the same zero summary for no response or an empty diff', () => {
		const zero = { added: 0, modified: 0, deleted: 0, lines: [] };

		expect(summarizeDiff(null)).toEqual(zero);
		expect(summarizeDiff(emptyDiff())).toEqual(zero);
	});
});

function importResult(collections: ImportBatchResult['collections']): ImportBatchResult {
	return { applied: false, mode: 'merge', collections };
}

describe('summarizeImport', () => {
	it('totals created/updated/deleted and renders only the collections that change, codepoint-sorted', () => {
		const summary = summarizeImport(
			importResult({
				directus_roles: { existing: ['t1'], new: ['t2'], deleted: [], mapped: {} },
				directus_settings: { existing: [], new: [], deleted: [], mapped: {} },
				articles: { existing: [], new: [], deleted: ['9', '10'], mapped: {} },
			}),
		);

		expect(summary).toMatchObject({ created: 1, updated: 1, deleted: 2 });

		expect(summary.lines).toEqual([
			'~ articles  +0 new  ~0 updated  ✖2 deleted (9, 10)',
			'~ directus_roles  +1 new  ~1 updated  ✖0 deleted',
		]);
	});

	it('subtracts client-known unchanged rows from existing before calling them updated', () => {
		const summary = summarizeImport(
			importResult({ directus_roles: { existing: ['t1', 't2', 't3'], new: [], deleted: [], mapped: {} } }),
			new Map([['directus_roles', new Set(['t1', 't3'])]]),
		);

		expect(summary).toMatchObject({ created: 0, updated: 1, deleted: 0 });

		const converged = summarizeImport(
			importResult({ directus_roles: { existing: ['t1'], new: [], deleted: [], mapped: {} } }),
			new Map([['directus_roles', new Set(['t1'])]]),
		);

		expect(converged).toEqual({ created: 0, updated: 0, deleted: 0, lines: ['no data changes'] });
	});

	it('names up to five deleted PKs then elides with a literal ellipsis', () => {
		const summary = summarizeImport(
			importResult({
				directus_permissions: {
					existing: [],
					new: [],
					deleted: [1, 2, 3, 4, 5, 6, 7],
					mapped: {},
				},
			}),
		);

		expect(summary.deleted).toBe(7);
		expect(summary.lines).toEqual(['~ directus_permissions  +0 new  ~0 updated  ✖7 deleted (1, 2, 3, 4, 5, …)']);
	});
});
