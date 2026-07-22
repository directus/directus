import { fetchDiff } from '../../sync/api.js';
import type { DiffResult, Snapshot } from '../../sync/contract.js';
import { readSnapshotFiles } from '../../sync/store.js';
import type { Target } from './resolve-target.js';

/**
 * The read → fetch sequence shared by diff and push. Both must resolve their local snapshot into a
 * target diff through one path so their preconditions and error semantics can never drift; the
 * command layer decides what to do with the result.
 */
export interface LocalDiff {
	readonly snapshot: Snapshot;
	readonly result: DiffResult | null;
}

export async function localDiff(target: Target, mode: 'merge' | 'mirror'): Promise<LocalDiff> {
	const snapshot = readSnapshotFiles(target.schemaDir);

	const result = await fetchDiff(target.credential, snapshot, mode);

	return { snapshot, result };
}
