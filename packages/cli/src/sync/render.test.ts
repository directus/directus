import { describe, expect, it } from 'vitest';
import type { ImportBatchResult, SchemaDiff } from './contract.js';
import { summarizeDiff, summarizeImport } from './render.js';

function emptyDiff(overrides: Partial<SchemaDiff> = {}): SchemaDiff {
	return { collections: [], fields: [], systemFields: [], relations: [], ...overrides };
}

describe('summarizeDiff', () => {
	it('classifies N/D/E items into added, deleted, and modified counts — per item, not per op', () => {
		// Counts drive the push gate; a root N adds, a root D deletes, a keyed edit modifies. The edited
		// field carries two ops but must still count as one modification.
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
		// A modification is only actionable if it says where: the unique dot-joined op paths, in parens.
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

	it('omits the parenthetical when no op carries a path', () => {
		// An added collection is a whole-item change with no inner path to name; the line must not trail an
		// empty "()".
		const summary = summarizeDiff(
			emptyDiff({ collections: [{ collection: 'events', diff: [{ kind: 'N', rhs: { collection: 'events' } }] }] }),
		);

		expect(summary.lines).toEqual(['+         collection events']);
	});

	it('groups collections → fields → systemFields → relations and codepoint-sorts within each group', () => {
		// Ordering is deterministic (codepoint, never locale) and grouped so the reader scans by kind.
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

	it('returns zero counts and no lines for an empty diff', () => {
		// The no-change case must be unambiguously empty, so the command can print nothing rather than a header.
		expect(summarizeDiff(emptyDiff())).toEqual({ added: 0, modified: 0, deleted: 0, lines: [] });
	});

	it('returns the zero summary for a null diff', () => {
		// null is the server's "schema already matches" answer (fetchDiff returns null on a 204). summarizeDiff
		// absorbs it into the same zero summary so push and diff read one shape for "no schema change" instead
		// of each re-spelling the { added: 0, … } literal and casting it beside the real summary.
		expect(summarizeDiff(null)).toEqual({ added: 0, modified: 0, deleted: 0, lines: [] });
	});
});

function importResult(collections: ImportBatchResult['collections']): ImportBatchResult {
	return { applied: false, mode: 'merge', collections };
}

describe('summarizeImport', () => {
	it('totals created/updated/deleted and renders only the collections that change, codepoint-sorted', () => {
		// The counts feed the deletion gate and the success sentence; the lines are the operator's plan. A
		// collection the import leaves untouched earns no line even though it ships in every batch, and the
		// order is codepoint (never response-key order) so the plan is byte-identical run to run.
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
		// The server reports every PK-present row as `existing` whether or not anything differed, so the
		// caller's unchanged set is the only honest source of "updated": a mirror batch that carried two
		// already-right rows (one of them for delete-survival) must summarize as one real update — and an
		// all-unchanged collection as no data changes at all.
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

	it('states "no data changes" when every collection is a no-op', () => {
		// A wholly-zero plan must say so, not render blank — the combined push plan can never leave the data
		// section ambiguous.
		const summary = summarizeImport(
			importResult({ directus_roles: { existing: [], new: [], deleted: [], mapped: {} } }),
		);

		expect(summary).toEqual({ created: 0, updated: 0, deleted: 0, lines: ['no data changes'] });
	});

	it('names up to five deleted PKs then elides with a literal ellipsis', () => {
		// A destructive plan must be legible before approval, but a large one must not flood the terminal:
		// the first five PKs are spelled out and the rest collapse to '…' — never a residual count.
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
