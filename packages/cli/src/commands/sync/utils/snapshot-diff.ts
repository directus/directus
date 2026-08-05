import type { SchemaDiffMode } from '../../../kernel/config/mode.js';
import { fetchServerVersion } from '../../../kernel/connection.js';
import { CliError } from '../../../kernel/error.js';
import type { CliContext } from '../../../kernel/run.js';
import { count } from '../../../kernel/text.js';
import { fetchDiff } from './api.js';
import type { DiffResult, SchemaDiff, Snapshot } from './contract.js';
import { findOutOfScopeReferences, formatOutOfScopeReferences } from './references.js';
import type { Target } from './resolve-target.js';

// A nested collection delete is misrouted as a whole collection drop by the server (#27877), while the
// plan classifies it as a modification. Refuse that shape; root deletes remain valid.
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

function parseableVersion(version: string | undefined): boolean {
	return version !== undefined && /^\d+\.\d+/.test(version);
}

// Mirror the server's exact-version gate, including patch versions. Unparseable versions remain the
// server's responsibility; explicit version-drift consent sends its supported force bypass.
function knownVersionMismatch(source: string, target: string | undefined): boolean {
	if (source === target) return false;
	return parseableVersion(source) && parseableVersion(target);
}

/**
 * Compare an already-read stored snapshot with a target using the same fetch path for diff and push.
 * Callers read the snapshot themselves so a never-pulled project fails before any request is made.
 */
export async function fetchSnapshotDiff(
	target: Target,
	snapshot: Snapshot,
	mode: SchemaDiffMode,
	allowVersionDrift: boolean,
	ctx: CliContext,
): Promise<DiffResult | null> {
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

	// Keep forced version drift visible in CI logs.
	if (forced) {
		ctx.ui.warn(
			`Version drift forced (--allow-version-drift): snapshot ${snapshot.directus} → target ${targetVersion ?? 'unknown'}. Cross-version diffs can surface spurious changes; read the plan closely.`,
		);
	}

	// A user may push scoped artifacts without having seen the corresponding pull warning.
	const references = findOutOfScopeReferences(snapshot);
	if (references.length > 0) ctx.ui.warn(formatOutOfScopeReferences(references));

	const result = await fetchDiff(target.credential, snapshot, mode, forced);

	if (result !== null) assertNoMisroutedCollectionDrops(result.diff);

	return result;
}
