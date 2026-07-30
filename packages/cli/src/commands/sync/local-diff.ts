import { fetchServerVersion } from '../../kernel/connection.js';
import { CliError } from '../../kernel/error.js';
import type { CliContext } from '../../kernel/run.js';
import { count } from '../../kernel/text.js';
import { fetchDiff } from '../../sync/api.js';
import type { DiffResult, SchemaDiff } from '../../sync/contract.js';
import { findOutOfScopeReferences, formatOutOfScopeReferences } from '../../sync/references.js';
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

// The version's major.minor, or undefined when the string is not a recognizable Directus version (a dev
// `0.0.0`, a fork tag, a git build). Patch is deliberately dropped — patch drift is not skew.
function majorMinor(version: string | undefined): string | undefined {
	const match = version?.match(/^(\d+)\.(\d+)/);
	return match ? `${match[1]}.${match[2]}` : undefined;
}

// The server's /schema/diff rejects ANY exact-version mismatch unless `force` is passed — but environments
// almost never run identical patch versions, and the in-process `directus schema apply` CLI applies
// snapshots with no version check at all. So the CLI owns the policy: patch drift diffs with `force`,
// major.minor skew is refused here with an actionable message (unforced, the server would reject it anyway,
// hinting at a `force` parameter the CLI deliberately does not expose wholesale — cross-version diffs
// surface spurious changes, the proactive form of the reactive #27877 guard below). An unparseable version
// on either side classifies as aligned-unknown: no force, and the server's exact-match gate stays the
// authority.
function classifyVersionDrift(source: string, target: string | undefined): 'aligned' | 'patch' | 'skew' {
	if (source === target) return 'aligned';

	const a = majorMinor(source);
	const b = majorMinor(target);

	if (a === undefined || b === undefined) return 'aligned';
	return a === b ? 'patch' : 'skew';
}

/**
 * Compare the committed snapshot with a target using the same read/fetch path for diff and push.
 */
export async function localDiff(target: Target, mode: 'merge' | 'mirror', ctx: CliContext): Promise<DiffResult | null> {
	const snapshot = readSnapshotFiles(target.schemaDir);

	// The snapshot records the source's version at pull time (snapshot.directus); compare it to the target's
	// live version so version skew surfaces as a clear refusal before apply, not as a puzzling server error.
	const targetVersion = await fetchServerVersion(target.credential);
	const drift = classifyVersionDrift(snapshot.directus, targetVersion);

	if (drift === 'skew') {
		throw new CliError(
			'STATE',
			`Version skew: the snapshot was pulled from Directus ${snapshot.directus}, but the target runs ${targetVersion ?? 'an unknown version'}.`,
			{
				hint: 'Schema diff across major.minor versions surfaces spurious changes. Align both instances at the same major.minor (patch drift is fine), re-pull if the source was upgraded, then re-run.',
			},
		);
	}

	// Warn before apply about references pointing outside the committed snapshot: a scoped export can strand
	// a group parent or relation target the fresh instance lacks, and apply fails on it. Independent of pull's
	// warning (Chris/Judd thread) — the operator may push a scope they did not pull.
	const references = findOutOfScopeReferences(snapshot);
	if (references.length > 0) ctx.ui.warn(formatOutOfScopeReferences(references));

	const result = await fetchDiff(target.credential, snapshot, mode, drift === 'patch');

	if (result !== null) assertNoMisroutedCollectionDrops(result.diff);

	return result;
}
