import type { SchemaDiffMode } from '../../../kernel/config/mode.js';
import { fetchServerVersion } from '../../../kernel/connection.js';
import { CliError } from '../../../kernel/error.js';
import type { CliContext } from '../../../kernel/run.js';
import { maybePluralize } from '../../../kernel/text.js';
import { fetchDiff } from './api.js';
import type { DiffResult, SchemaDiff, Snapshot } from './contract.js';
import {
	findOutOfScopeReferences,
	findSplitRelations,
	formatOutOfScopeReferences,
	formatSplitRelations,
} from './references.js';
import type { Target } from './resolve-target.js';

// The server misroutes a nested collection delete as a whole collection drop (#27877), while the plan
// classifies the same op as a modification. Only that shape is refused; root deletes stay valid.
function assertNoMisroutedCollectionDrops(diff: SchemaDiff): void {
	const misrouted = diff.collections
		.filter((entry) => entry.diff[0]?.kind === 'D' && (entry.diff[0].path?.length ?? 0) > 0)
		.map((entry) => entry.collection);

	if (misrouted.length === 0) return;

	throw new CliError(
		'STATE',
		`Refusing this diff: applying it would DROP ${maybePluralize(misrouted.length, 'collection')} (${misrouted.join(', ')}) from a metadata-only change (directus/directus#27877).`,
		{
			hint: 'This diff shape comes from migration skew — the instances carry different collection metadata columns despite matching version strings. Run the same Directus version and migrations on both instances, then re-run.',
		},
	);
}

function parseableVersion(version: string | undefined): boolean {
	return version !== undefined && /^\d+\.\d+/.test(version);
}

// Mirrors the server's exact-version gate, patch versions included. Unparseable versions and the vendor
// gate stay the server's to enforce.
function knownVersionMismatch(source: string, target: string | undefined): boolean {
	if (source === target) return false;
	return parseableVersion(source) && parseableVersion(target);
}

// Every gate a diff can trip closes with this sentence, so keying on it covers gates added later without
// hinting at errors force cannot clear.
const BYPASS_MARKER = 'You can bypass this check by passing the "force" query parameter';

/** The vendor gate cannot be pre-checked: `/server/info` omits the vendor, so the refusal names it first. */
function enrichDiffError(error: unknown, url: string): unknown {
	if (error instanceof CliError && error.detail !== undefined && error.detail.includes(BYPASS_MARKER)) {
		return new CliError('STATE', `${url} refused the snapshot as incompatible with this instance.`, {
			hint: 'Pass --allow-drift to send the force bypass the server names. Comparing across Directus versions or database vendors can surface spurious changes, so read the plan closely.',
			detail: error.detail,
		});
	}

	return error;
}

export interface SnapshotDiffOptions {
	readonly mode: SchemaDiffMode;
	readonly command: 'diff' | 'push';
	readonly allowDrift: boolean;
}

export async function fetchSnapshotDiff(
	target: Target,
	snapshot: Snapshot,
	options: SnapshotDiffOptions,
	ctx: CliContext,
): Promise<DiffResult | null> {
	const { mode, command, allowDrift } = options;
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

	// Warned whenever the flag is armed: the vendor half of the gate is invisible from here.
	if (allowDrift) {
		ctx.ui.warn(
			`Compatibility check bypassed (--allow-drift): the snapshot is from Directus ${snapshot.directus} on ${snapshot.vendor} → target runs ${targetVersion ?? 'an unknown version'}. Cross-version and cross-vendor diffs can surface spurious changes; read the plan closely.`,
		);
	}

	// Repeated from pull: whoever pushes these artifacts may never have seen the pull warning.
	const references = findOutOfScopeReferences(snapshot);
	if (references.length > 0) ctx.ui.warn(formatOutOfScopeReferences(references));

	const splits = findSplitRelations(snapshot);
	if (splits.length > 0) ctx.ui.warn(formatSplitRelations(splits, command));

	const result = await fetchDiff(target.credential, snapshot, mode, allowDrift).catch((error: unknown) => {
		throw enrichDiffError(error, target.url);
	});

	if (result !== null) assertNoMisroutedCollectionDrops(result.diff);

	return result;
}
