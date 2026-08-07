import { isPlainObject } from 'lodash-es';
import { count } from '../../../kernel/text.js';
import { byCodepoint } from './codepoint.js';
import type { Snapshot } from './contract.js';

/**
 * A reference inside the snapshot that points at a collection the snapshot does not include. It is
 * harmless where the target already has that collection, but on a fresh target the collection is absent
 * and apply fails (today a raw 500 — see the server scoped-snapshot writeup). Scoped sync can strand
 * these silently, so the CLI warns rather than refusing or widening the scope on the user's behalf.
 */
interface OutOfScopeReference {
	/** How the reference is expressed: a group nesting, a fixed m2o/o2m relation, or an m2a allow-list. */
	readonly kind: 'group' | 'relation' | 'm2a';
	/** The pointing site: a collection (group) or `collection.field` (relation/m2a). */
	readonly from: string;
	/** The referenced collections absent from the snapshot, sorted. */
	readonly missing: readonly string[];
}

// System collections exist on every target and cannot be genuinely out of scope.
function isSystem(collection: string): boolean {
	return collection.startsWith('directus_');
}

function readMeta(entry: Record<string, unknown>, key: string): unknown {
	const meta = entry['meta'];
	return isPlainObject(meta) ? (meta as Record<string, unknown>)[key] : undefined;
}

/**
 * Find every reference in the snapshot that targets a collection the snapshot does not include. Pure over
 * the assembled snapshot — the CLI already holds all of this, so there is no extra fetch. Output is sorted
 * for deterministic warnings regardless of the source snapshot's entry order.
 */
export function findOutOfScopeReferences(snapshot: Snapshot): OutOfScopeReference[] {
	const present = new Set(snapshot.collections.map((entry) => entry.collection));

	const resolvable = (collection: string): boolean => present.has(collection) || isSystem(collection);

	const references: OutOfScopeReference[] = [];

	// Studio group nesting is a foreign key to another collection.
	for (const entry of snapshot.collections) {
		const group = readMeta(entry, 'group');

		if (typeof group === 'string' && !resolvable(group)) {
			references.push({ kind: 'group', from: entry.collection, missing: [group] });
		}
	}

	// M2A targets live in one_allowed_collections instead of related_collection.
	for (const relation of snapshot.relations) {
		const from = `${relation.collection}.${relation.field}`;

		if (relation.related_collection !== null) {
			if (!resolvable(relation.related_collection)) {
				references.push({ kind: 'relation', from, missing: [relation.related_collection] });
			}

			continue;
		}

		const allowed = readMeta(relation, 'one_allowed_collections');

		if (Array.isArray(allowed)) {
			const missing = allowed
				.filter((value): value is string => typeof value === 'string' && !resolvable(value))
				.sort(byCodepoint);

			if (missing.length > 0) references.push({ kind: 'm2a', from, missing });
		}
	}

	return references.sort((a, b) => byCodepoint(a.from, b.from) || byCodepoint(a.kind, b.kind));
}

/**
 * One half of a relation pair the snapshot carries without the other. A relation entry lives in the
 * many-side collection's file while the alias field it names via meta.one_field belongs to the related
 * collection, so a scoped pull can rewrite one file and leave its partner stale. A target that lacks the
 * missing half shows the relationship broken in the Data Studio; as with out-of-scope references, the CLI
 * warns rather than widening the scope on the user's behalf.
 */
export interface SplitRelation {
	/** Which half is present: a relation entry, or a relational alias field. */
	readonly kind: 'relation' | 'alias';
	/** The present half: `collection.field`. */
	readonly from: string;
	/** For a relation, the missing paired field as `collection.field`; for an alias, its relational special. */
	readonly detail: string;
}

// The specials whose alias fields exist only as the near half of a relation.
const RELATIONAL_SPECIALS = new Set(['o2m', 'm2m', 'm2a', 'translations', 'files']);

/**
 * Find every relation pair the snapshot splits: a relation whose meta.one_field names a field the snapshot
 * lacks, or a relational alias field with no relation behind it. Pure over the assembled snapshot, like
 * findOutOfScopeReferences. Built-in system fields and relations are outside the snapshot contract, but
 * custom fields on system collections travel in `fields`, so pairs reaching into them are still checked.
 */
export function findSplitRelations(snapshot: Snapshot): SplitRelation[] {
	const present = new Set(snapshot.collections.map((entry) => entry.collection));
	const fields = new Set(snapshot.fields.map((entry) => `${entry.collection}.${entry.field}`));

	const backed = new Set<string>();
	const splits: SplitRelation[] = [];

	for (const relation of snapshot.relations) {
		const oneField = readMeta(relation, 'one_field');

		if (typeof oneField !== 'string' || relation.related_collection === null) continue;

		const paired = `${relation.related_collection}.${oneField}`;
		backed.add(paired);

		// An absent related collection is already an out-of-scope reference; this covers the stale partner.
		if (!present.has(relation.related_collection) && !isSystem(relation.related_collection)) continue;

		if (!fields.has(paired)) {
			splits.push({ kind: 'relation', from: `${relation.collection}.${relation.field}`, detail: paired });
		}
	}

	for (const entry of snapshot.fields) {
		const special = readMeta(entry, 'special');

		if (!Array.isArray(special)) continue;

		const relational = special.find(
			(value): value is string => typeof value === 'string' && RELATIONAL_SPECIALS.has(value),
		);

		if (relational === undefined) continue;

		const from = `${entry.collection}.${entry.field}`;
		if (!backed.has(from)) splits.push({ kind: 'alias', from, detail: relational });
	}

	return splits.sort((a, b) => byCodepoint(a.from, b.from) || byCodepoint(a.kind, b.kind));
}

const REFERENCE_LABELS: Record<OutOfScopeReference['kind'], string> = {
	group: 'group parent',
	relation: 'relation',
	m2a: 'm2a',
};

function describeReference(reference: OutOfScopeReference): string {
	return `  ${reference.from} → ${reference.missing.join(', ')} (${REFERENCE_LABELS[reference.kind]})`;
}

/**
 * Render out-of-scope references as one warning block: a lead line stating the consequence, then one line
 * per reference naming the pointing site and its missing target(s). Same wording on pull and push — the
 * fact ("these point outside the sync; a fresh target will fail") holds in both phases.
 */
export function formatOutOfScopeReferences(references: readonly OutOfScopeReference[]): string {
	const missing = new Set(references.flatMap((reference) => reference.missing));

	const lead =
		`This sync references ${count(missing.size, 'collection')} it does not include. ` +
		`Applying it to a target that lacks them will fail; add them to the scope to include them:`;

	return [lead, ...references.map(describeReference)].join('\n');
}

function describeSplit(split: SplitRelation): string {
	return split.kind === 'relation'
		? `  ${split.from} (relation) — missing its paired field ${split.detail}`
		: `  ${split.from} (${split.detail} field) — missing its relation`;
}

/**
 * Render split relation pairs as one warning block, shaped like the out-of-scope warning: a lead line
 * stating the consequence, then one line per present half naming what it is missing. Same wording on pull
 * and push — the fact ("half of this relation is not in the sync") holds in both phases.
 */
export function formatSplitRelations(splits: readonly SplitRelation[]): string {
	const lead =
		`This sync carries one side of ${count(splits.length, 'relation')} without the other. ` +
		`A target that lacks the missing half is left with a broken relationship; pull with both collections in scope to include it:`;

	return [lead, ...splits.map(describeSplit)].join('\n');
}
