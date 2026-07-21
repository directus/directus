import { CliError } from '../../kernel/error.js';
import { fetchDiff } from '../../sync/api.js';
import { type DiffResult, type Snapshot, SNAPSHOT_PARTIAL } from '../../sync/contract.js';
import { readSnapshotFiles } from '../../sync/store.js';
import type { Target } from './resolve-target.js';

// The read → partial-mirror guard → fetch sequence shared by diff and push. Both must resolve their
// local snapshot into a target diff through one path so their preconditions and error semantics can
// never drift; the command layer decides what to do with the result.
export interface LocalDiff {
	readonly snapshot: Snapshot;
	readonly result: DiffResult | null;
}

export async function localDiff(target: Target, mode: 'merge' | 'mirror'): Promise<LocalDiff> {
	const snapshot = readSnapshotFiles(target.schemaDir);

	// Guard before any network call. The restriction is CLI-side, not server-side: the server scopes
	// partial mirror diffs correctly, but this CLI cannot yet produce or reason about a partial
	// snapshot (it has no scope configuration), so a partial in mirror mode is unsupported here rather
	// than wrong on the wire — refuse it until scoped support lands.
	if (snapshot.version === SNAPSHOT_PARTIAL && mode === 'mirror') {
		throw new CliError('USAGE', 'This CLI cannot yet diff a partial snapshot in mirror mode.', {
			hint: 'Use --mode merge; scoped mirror support arrives with sync scope configuration.',
		});
	}

	const result = await fetchDiff(target.credential, snapshot, mode);

	return { snapshot, result };
}
