import type { LicenseResolvedKey, LicenseResolvedOutput, LicenseRestoreInput } from '@directus/types';

export type RestoreSelectionCounts = Record<LicenseResolvedKey, number>;

export type ResolutionDirection = 'deactivate' | 'restore';

export function effectiveUsage(direction: ResolutionDirection, usage: number, selected: number): number {
	return direction === 'restore' ? usage + selected : usage - selected;
}

function fits(limit: number, usage: number, selected: number): boolean {
	return limit === -1 || usage + selected <= limit;
}

export function isAtCapacity(limit: number, usage: number, selected: number): boolean {
	return !fits(limit, usage, selected + 1);
}

function sectionFits(section: { limit: number; usage: number } | undefined, selected: number): boolean {
	return !section || fits(section.limit, section.usage, selected);
}

export function canSubmitRestore(output: LicenseResolvedOutput, selected: RestoreSelectionCounts): boolean {
	const total = selected.collections + selected.flows + selected.seats + selected.sso_users;

	if (total === 0) return false;
	if (selected.sso_users > 0 && output.sso_users?.entitled !== true) return false;

	return (
		sectionFits(output.collections, selected.collections) &&
		sectionFits(output.flows, selected.flows) &&
		sectionFits(output.seats ?? output.sso_users, selected.seats + selected.sso_users)
	);
}

export function countNotRestored(selected: LicenseRestoreInput, restored: LicenseRestoreInput | undefined): number {
	let missing = 0;

	for (const [key, ids] of Object.entries(selected) as [LicenseResolvedKey, string[] | undefined][]) {
		const done = new Set(restored?.[key] ?? []);
		missing += (ids ?? []).filter((id) => !done.has(id)).length;
	}

	return missing;
}
