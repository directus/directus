import { DiffKind } from '@directus/types';
import type { Diff } from 'deep-diff';

/** Allow a diff entry's deletion: `merge` mode suppresses deletions to stay additive, other modes allow all. */
export function isDeleteAllowed(entry: { diff: Diff<any>[] | undefined }, mode: 'merge' | 'mirror' | undefined) {
	if (mode !== 'merge') return true;

	const change = entry.diff?.[0];
	if (change?.kind !== DiffKind.DELETE) return true;

	// `deep-diff` reports a whole-entity deletion as a root-level `D` (i.e. no `path`)
	return change.path !== undefined;
}
