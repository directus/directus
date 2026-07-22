import { CliError } from '../../kernel/error.js';
import { count } from '../../kernel/text.js';
import { fetchDiff } from '../../sync/api.js';
import type { DiffResult, SchemaDiff } from '../../sync/contract.js';
import { readSnapshotFiles } from '../../sync/store.js';
import type { Target } from './resolve-target.js';

// The server's apply drops a WHOLE collection whenever the first diff op is kind D — even a nested
// meta.* delete produced by migration skew between instances (directus/directus#27877; the field branch
// guards this, the collection branch does not). Such an entry classifies here as a modification, so the
// plan would show a harmless tweak and the deletion gate would never fire. Refuse before anything can
// display or apply it; a genuine collection delete is a root D and passes untouched.
function assertNoMisroutedCollectionDrops(diff: SchemaDiff): void {
	const misrouted = diff.collections
		.filter((entry) => entry.diff[0]?.kind === 'D' && (entry.diff[0].path?.length ?? 0) > 0)
		.map((entry) => entry.collection);

	if (misrouted.length === 0) return;

	throw new CliError(
		'STATE',
		`Refusing this diff: applying it would DROP ${count(misrouted.length, 'collection')} (${misrouted.join(', ')}) from a metadata-only change (directus/directus#27877).`,
		{
			hint: 'This diff shape comes from migration skew — the instances carry different collection metadata columns despite matching version strings. Run the same Directus version and migrations on both instances, then re-run.',
		},
	);
}

/**
 * Compare the committed snapshot with a target using the same read/fetch path for diff and push.
 */
export async function localDiff(target: Target, mode: 'merge' | 'mirror'): Promise<DiffResult | null> {
	const snapshot = readSnapshotFiles(target.schemaDir);

	const result = await fetchDiff(target.credential, snapshot, mode);

	if (result !== null) assertNoMisroutedCollectionDrops(result.diff);

	return result;
}
