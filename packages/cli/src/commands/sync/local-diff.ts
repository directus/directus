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

// A recognizable Directus version, or undefined for a dev `0.0.0`-style fork tag or a failed probe.
function parseableVersion(version: string | undefined): boolean {
	return version !== undefined && /^\d+\.\d+/.test(version);
}

// The server enforces an EXACT version match on /schema/diff (validate-snapshot's strict `!==` — patch
// included, because historically some patches are breaking; core's call is to keep that). The CLI mirrors
// the same design instead of second-guessing it: refuse a known mismatch here with both versions and the
// remedy named (unforced, the server would reject it anyway with a hint about a query parameter the CLI
// user cannot pass), and expose the server's own sanctioned bypass as an explicit flag that sends `force`.
// An unparseable version on either side is not a KNOWN mismatch: no refusal, and the server's exact-match
// gate stays the authority.
function knownVersionMismatch(source: string, target: string | undefined): boolean {
	if (source === target) return false;
	return parseableVersion(source) && parseableVersion(target);
}

/**
 * Compare the committed snapshot with a target using the same read/fetch path for diff and push.
 */
export async function localDiff(
	target: Target,
	mode: 'merge' | 'mirror',
	ctx: CliContext,
	allowVersionDrift = false,
): Promise<DiffResult | null> {
	const snapshot = readSnapshotFiles(target.schemaDir);

	// The snapshot records the source's version at pull time (snapshot.directus); compare it to the target's
	// live version so a version mismatch surfaces as a clear refusal before apply, not as a puzzling server
	// error.
	const targetVersion = await fetchServerVersion(target.credential);
	const forced = allowVersionDrift && snapshot.directus !== targetVersion;

	if (!allowVersionDrift && knownVersionMismatch(snapshot.directus, targetVersion)) {
		throw new CliError(
			'STATE',
			`Version mismatch: the snapshot was pulled from Directus ${snapshot.directus}, but the target runs ${targetVersion ?? 'an unknown version'}.`,
			{
				hint: 'The server requires an exact version match for schema diffs — historically some patches are breaking. Align both instances (re-pull if the source was upgraded), or pass --allow-version-drift to proceed anyway.',
			},
		);
	}

	// The forced run must not be silent: the operator (or a CI log reader) needs the versions on record
	// when a cross-version diff produces a strange plan.
	if (forced) {
		ctx.ui.warn(
			`Version drift forced (--allow-version-drift): snapshot ${snapshot.directus} → target ${targetVersion ?? 'unknown'}. Cross-version diffs can surface spurious changes; read the plan closely.`,
		);
	}

	// Warn before apply about references pointing outside the committed snapshot: a scoped export can strand
	// a group parent or relation target the fresh instance lacks, and apply fails on it. Independent of pull's
	// warning (Chris/Judd thread) — the operator may push a scope they did not pull.
	const references = findOutOfScopeReferences(snapshot);
	if (references.length > 0) ctx.ui.warn(formatOutOfScopeReferences(references));

	const result = await fetchDiff(target.credential, snapshot, mode, forced);

	if (result !== null) assertNoMisroutedCollectionDrops(result.diff);

	return result;
}
