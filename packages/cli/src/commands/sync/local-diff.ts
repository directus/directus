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
// `0.0.0`, a fork tag, a git build). Patch is deliberately dropped — patch drift is not skew worth warning.
function majorMinor(version: string | undefined): string | undefined {
	const match = version?.match(/^(\d+)\.(\d+)/);
	return match ? `${match[1]}.${match[2]}` : undefined;
}

// Warn when the target's Directus version differs (at major.minor) from the source the snapshot was pulled
// from. Diffing/applying a schema across versions can surface spurious changes — the proactive form of the
// reactive #27877 guard below. Best-effort: an unreadable or unparseable version on either side skips.
function versionSkewWarning(source: string, target: string | undefined): string | undefined {
	const a = majorMinor(source);
	const b = majorMinor(target);

	if (a === undefined || b === undefined || a === b) return undefined;

	return `Version skew: the snapshot was pulled from Directus ${source}, but ${target} is on the target. Schema diff/apply across versions can surface spurious changes — align the versions if the plan looks wrong.`;
}

/**
 * Compare the committed snapshot with a target using the same read/fetch path for diff and push.
 */
export async function localDiff(target: Target, mode: 'merge' | 'mirror', ctx: CliContext): Promise<DiffResult | null> {
	const snapshot = readSnapshotFiles(target.schemaDir);

	// The snapshot records the source's version at pull time (snapshot.directus); compare it to the target's
	// live version so version skew surfaces as a warning before apply, not as a puzzling diff.
	const skew = versionSkewWarning(snapshot.directus, await fetchServerVersion(target.credential));
	if (skew !== undefined) ctx.ui.warn(skew);

	// Warn before apply about references pointing outside the committed snapshot: a scoped export can strand
	// a group parent or relation target the fresh instance lacks, and apply fails on it. Independent of pull's
	// warning (Chris/Judd thread) — the operator may push a scope they did not pull.
	const references = findOutOfScopeReferences(snapshot);
	if (references.length > 0) ctx.ui.warn(formatOutOfScopeReferences(references));

	const result = await fetchDiff(target.credential, snapshot, mode);

	if (result !== null) assertNoMisroutedCollectionDrops(result.diff);

	return result;
}
