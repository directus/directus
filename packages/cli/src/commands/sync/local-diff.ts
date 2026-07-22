import { fetchDiff } from '../../sync/api.js';
import type { DiffResult } from '../../sync/contract.js';
import { readSnapshotFiles } from '../../sync/store.js';
import type { Target } from './resolve-target.js';

/**
 * The read → fetch sequence shared by diff and push. Both must resolve their local snapshot into a
 * target diff through one path so their preconditions and error semantics can never drift; the
 * command layer decides what to do with the null-when-identical result.
 */
export async function localDiff(target: Target, mode: 'merge' | 'mirror'): Promise<DiffResult | null> {
	const snapshot = readSnapshotFiles(target.schemaDir);

	return fetchDiff(target.credential, snapshot, mode);
}
