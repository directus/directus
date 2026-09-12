import { DiffKind } from '@directus/types';
import type { Diff } from 'deep-diff';

/**
 * Checks whether a diff represents the creation of an entire entity (root-level `NEW`).
 * Property additions on existing entities have a non-empty `path`.
 */
export function isNewEntity(diff: Diff<any>[] | undefined): boolean {
	return diff?.[0]?.kind === DiffKind.NEW && !diff[0]?.path;
}

/**
 * Checks whether a diff represents the deletion of an entire entity (root-level `DELETE`).
 * Property deletions on existing entities have a non-empty `path`.
 */
export function isDeletedEntity(diff: Diff<any>[] | undefined): boolean {
	return diff?.[0]?.kind === DiffKind.DELETE && !diff[0]?.path;
}
