import type { LicenseResolvedKey, LicenseResolvedOutput, LicenseRestoreInput } from '@directus/types';

export type RestoreSelectionCounts = Record<LicenseResolvedKey, number>;

export function effectiveUsage(direction: 'deactivate' | 'restore', usage: number, selected: number): number {
	return direction === 'restore' ? usage + selected : usage - selected;
}

export function isAtCapacity(limit: number, usage: number, selected: number): boolean {
	if (limit === -1) return false;
	return usage + selected >= limit;
}

function fits(section: { limit: number; usage: number } | undefined, selected: number): boolean {
	if (!section || section.limit === -1) return true;
	return section.usage + selected <= section.limit;
}

export function canSubmitRestore(output: LicenseResolvedOutput, selected: RestoreSelectionCounts): boolean {
	const total = selected.collections + selected.flows + selected.seats + selected.sso_users;

	if (total === 0) return false;
	if (selected.sso_users > 0 && output.sso_users?.entitled !== true) return false;

	return (
		fits(output.collections, selected.collections) &&
		fits(output.flows, selected.flows) &&
		fits(output.seats ?? output.sso_users, selected.seats + selected.sso_users)
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
