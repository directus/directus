import { isPlainObject } from 'lodash-es';
import { count } from '../kernel/text.js';
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

// System collections exist on every Directus instance, so a reference to directus_users/directus_files is
// never dangling on a target — only user collections can be genuinely out of scope.
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
 * for deterministic warnings regardless of the source snapshot's row order.
 */
export function findOutOfScopeReferences(snapshot: Snapshot): OutOfScopeReference[] {
	const present = new Set(snapshot.collections.map((entry) => entry.collection));

	// A target resolves if it is in the snapshot or is a system collection present on every instance.
	const resolvable = (collection: string): boolean => present.has(collection) || isSystem(collection);

	const references: OutOfScopeReference[] = [];

	// Group parents: meta.group nests one collection under another in the Studio sidebar. It is a plain FK
	// to any directus_collections.collection; an out-of-scope parent leaves the collection with a dangling
	// group that the server cannot resolve on a fresh target.
	for (const entry of snapshot.collections) {
		const group = readMeta(entry, 'group');

		if (typeof group === 'string' && !resolvable(group)) {
			references.push({ kind: 'group', from: entry.collection, missing: [group] });
		}
	}

	// Relations: m2o/o2m name their one target in related_collection; m2a leaves it null and lists the
	// allowed targets in meta.one_allowed_collections instead.
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
 * per reference naming the pointing site and its missing target(s). Same wording on export and apply — the
 * fact ("these point outside the sync; a fresh target will fail") holds in both phases.
 */
export function formatOutOfScopeReferences(references: readonly OutOfScopeReference[]): string {
	const missing = new Set(references.flatMap((reference) => reference.missing));

	const lead =
		`This sync references ${count(missing.size, 'collection')} it does not include. ` +
		`Applying it to a target that lacks them will fail; add them to the scope to include them:`;

	return [lead, ...references.map(describeReference)].join('\n');
}
