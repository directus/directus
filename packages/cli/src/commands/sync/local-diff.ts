import { fetchDiff } from '../../sync/api.js';
import type { DiffResult } from '../../sync/contract.js';
import { readSnapshotFiles } from '../../sync/store.js';
import type { Target } from './resolve-target.js';

/**
 * Compare the committed snapshot with a target using the same read/fetch path for diff and push.
 */
export async function localDiff(target: Target, mode: 'merge' | 'mirror'): Promise<DiffResult | null> {
	const snapshot = readSnapshotFiles(target.schemaDir);

	return fetchDiff(target.credential, snapshot, mode);
}
