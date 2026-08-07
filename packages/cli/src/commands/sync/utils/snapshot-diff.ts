import type { SchemaDiffMode } from '../../../kernel/config/mode.js';
import { fetchServerVersion } from '../../../kernel/connection.js';
import { CliError } from '../../../kernel/error.js';
import type { CliContext } from '../../../kernel/run.js';
import { count } from '../../../kernel/text.js';
import { fetchDiff } from './api.js';
import type { DiffResult, SchemaDiff, Snapshot } from './contract.js';
import {
	findOutOfScopeReferences,
	findSplitRelations,
	formatOutOfScopeReferences,
	formatSplitRelations,
} from './references.js';
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

// Mirror the server's exact-version gate, including patch versions. This is the only compatibility gate
// the CLI can answer locally: unparseable versions and the vendor gate both stay the server's to enforce.
function knownVersionMismatch(source: string, target: string | undefined): boolean {
	if (source === target) return false;
	return parseableVersion(source) && parseableVersion(target);
}

// Every gate validateSnapshot can bypass closes with this sentence. Keying on the server's own bypass
// marker rather than each gate's wording means a gate added later still points at the flag that clears
// it, while a payload error force cannot help (the schema validation runs first) never gets the hint.
const BYPASS_MARKER = 'You can bypass this check by passing the "force" query parameter';

/**
 * Re-raise a target's snapshot refusal as the flag that clears it. The vendor gate cannot be pre-checked
 * the way the version gate can — `/server/info` does not carry the vendor and the only endpoint that does
 * builds an entire snapshot to answer — so the server's refusal is the first place it can be named.
 */
function enrichDiffError(error: unknown, url: string): unknown {
	if (error instanceof CliError && error.detail !== undefined && error.detail.includes(BYPASS_MARKER)) {
		return new CliError('STATE', `${url} refused the snapshot as incompatible with this instance.`, {
			hint: 'Pass --allow-drift to send the force bypass the server names. Comparing across Directus versions or database vendors can surface spurious changes, so read the plan closely.',
			detail: error.detail,
		});
	}

	return error;
}

/**
 * Compare an already-read stored snapshot with a target using the same fetch path for diff and push.
 * Callers read the snapshot themselves so a never-pulled project fails before any request is made.
 */
export async function fetchSnapshotDiff(
	target: Target,
	snapshot: Snapshot,
	mode: SchemaDiffMode,
	allowDrift: boolean,
	ctx: CliContext,
): Promise<DiffResult | null> {
	const targetVersion = await fetchServerVersion(target.credential);

	if (!allowDrift && knownVersionMismatch(snapshot.directus, targetVersion)) {
		throw new CliError(
			'STATE',
			`Version mismatch: the snapshot was pulled from Directus ${snapshot.directus}, but the target runs ${targetVersion ?? 'an unknown version'}.`,
			{
				hint: 'The server requires an exact version match for schema diffs — historically some patches are breaking. Align both instances (re-pull if the source was upgraded), or pass --allow-drift to proceed anyway.',
			},
		);
	}

	// Keep the bypass visible in CI logs whenever it is armed, not only when the CLI can see what it cleared:
	// the vendor half of the gate is invisible from here, so an unmentioned mismatch is still being waved through.
	if (allowDrift) {
		ctx.ui.warn(
			`Compatibility check bypassed (--allow-drift): the snapshot is from Directus ${snapshot.directus} on ${snapshot.vendor} → target runs ${targetVersion ?? 'an unknown version'}. Cross-version and cross-vendor diffs can surface spurious changes; read the plan closely.`,
		);
	}

	// A user may push scoped artifacts without having seen the corresponding pull warning.
	const references = findOutOfScopeReferences(snapshot);
	if (references.length > 0) ctx.ui.warn(formatOutOfScopeReferences(references));

	const splits = findSplitRelations(snapshot);
	if (splits.length > 0) ctx.ui.warn(formatSplitRelations(splits));

	const result = await fetchDiff(target.credential, snapshot, mode, allowDrift).catch((error: unknown) => {
		throw enrichDiffError(error, target.url);
	});

	if (result !== null) assertNoMisroutedCollectionDrops(result.diff);

	return result;
}
