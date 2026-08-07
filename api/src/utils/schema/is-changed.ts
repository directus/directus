import type { Diff } from 'deep-diff';

/** Keep only diff entries that actually changed. */
export function isChanged(entry: { diff: Diff<any>[] | undefined }) {
	// `deep-diff` returns `undefined` when the two entities are identical.
	return Array.isArray(entry.diff);
}
