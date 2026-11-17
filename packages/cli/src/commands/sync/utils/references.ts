import { isPlainObject } from 'lodash-es';
import { maybePluralize } from '../../../kernel/text.js';
import { byCodepoint } from './codepoint.js';
import type { Snapshot } from './contract.js';

/**
 * A reference pointing at a collection the snapshot omits. Harmless if the target already has it, fatal on
 * a fresh one — so the CLI warns rather than refusing or widening the scope itself.
 */
interface OutOfScopeReference {
	readonly kind: 'group' | 'relation' | 'm2a';
	/** The pointing site: a collection (group) or `collection.field` (relation/m2a). */
	readonly from: string;
	/** Sorted, for deterministic warnings. */
	readonly missing: readonly string[];
}

// System collections exist on every target, so they are never out of scope.
function isSystem(collection: string): boolean {
	return collection.startsWith('directus_');
}

function readMeta(entry: Record<string, unknown>, key: string): unknown {
	const meta = entry['meta'];
	return isPlainObject(meta) ? (meta as Record<string, unknown>)[key] : undefined;
}

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
 * many-side collection's file while the field it names via meta.one_field belongs to the related
 * collection, so a scoped pull can rewrite one file and leave its partner stale.
 */
export type SplitRelation =
	| {
			readonly kind: 'relation';
			/** The present half, as `collection.field`. */
			readonly from: string;
			readonly fromCollection: string;
			readonly relatedCollection: string;
			/** The missing corresponding field, as `collection.field`. */
			readonly pairedField: string;
	  }
	| {
			/** An alias field with no relation behind it, so its defining file is unknown. */
			readonly kind: 'alias';
			readonly from: string;
			readonly special: string;
	  };

// The specials whose alias fields exist only as the near half of a relation.
const RELATIONAL_SPECIALS = new Set(['o2m', 'm2m', 'm2a', 'translations', 'files']);

/**
 * Built-in system fields and relations are outside the snapshot contract, but custom fields on system
 * collections travel in `fields`, so pairs reaching into them are still checked.
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
			splits.push({
				kind: 'relation',
				from: `${relation.collection}.${relation.field}`,
				fromCollection: relation.collection,
				relatedCollection: relation.related_collection,
				pairedField: paired,
			});
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
		if (!backed.has(from)) splits.push({ kind: 'alias', from, special: relational });
	}

	return splits.sort((a, b) => byCodepoint(a.from, b.from) || byCodepoint(a.kind, b.kind));
}

const REFERENCE_LABELS: Record<OutOfScopeReference['kind'], string> = {
	group: 'group parent',
	relation: 'relation',
	m2a: 'm2a',
};

function formatReference(reference: OutOfScopeReference): string {
	return `  ${reference.from} → ${reference.missing.join(', ')} (${REFERENCE_LABELS[reference.kind]})`;
}

export function formatOutOfScopeReferences(references: readonly OutOfScopeReference[]): string {
	const missing = new Set(references.flatMap((reference) => reference.missing));

	const lead =
		`This sync references ${maybePluralize(missing.size, 'collection')} it does not include. ` +
		`Applying it to a target that lacks them will fail; add them to the scope to include them:`;

	return [lead, ...references.map(formatReference)].join('\n');
}

function formatSplit(split: SplitRelation): string {
	return split.kind === 'relation'
		? `  ${split.from} → ${split.relatedCollection}: missing the corresponding field ${split.pairedField}`
		: `  ${split.from} (${split.special}): missing the relation that defines it`;
}

/** An alias's defining relation lives in a file the sync lacks, so those cases can only advise a full pull. */
export function formatSplitRelations(splits: readonly SplitRelation[], subject: 'pull' | 'diff' | 'push'): string {
	const one = splits.length === 1;

	const lead =
		`This ${subject} is missing half of ${maybePluralize(splits.length, 'relation')}. ` +
		`Pushing may leave ${one ? 'this relation' : 'these relations'} broken on the target:`;

	const pair = [
		...new Set(
			splits.flatMap((split) => (split.kind === 'relation' ? [split.fromCollection, split.relatedCollection] : [])),
		),
	].sort(byCodepoint);

	const include = `To include ${one ? 'the relation' : 'the relations'}`;

	const fix = splits.every((split) => split.kind === 'relation')
		? `  ${include}: pull with --collections ${pair.join(',')}`
		: `  ${include}: pull the full schema (drop --collections)`;

	return [lead, ...splits.map(formatSplit), fix].join('\n');
}
