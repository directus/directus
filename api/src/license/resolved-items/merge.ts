import type { LicenseResolvedItems, LicenseResolvedKey, LicenseRestoreInput } from '@directus/types';

function entries<T>(record: Partial<Record<LicenseResolvedKey, T>>): [LicenseResolvedKey, T][] {
	return Object.entries(record) as [LicenseResolvedKey, T][];
}

export function mergeResolvedItems(
	current: LicenseResolvedItems | null,
	added: LicenseRestoreInput,
	now: string,
): LicenseResolvedItems {
	const result: LicenseResolvedItems = { ...current };

	for (const [key, ids] of entries(added)) {
		if (!ids || ids.length === 0) continue;

		const kept = (result[key] ?? []).filter((entry) => !ids.includes(entry.id));
		const fresh = [...new Set(ids)].map((id) => ({ id, resolved_at: now }));

		result[key] = [...kept, ...fresh];
	}

	return result;
}

// Matching on resolved_at keeps entries a concurrent resolve recorded again after the snapshot was read
export function removeResolvedEntries(
	current: LicenseResolvedItems | null,
	removed: LicenseResolvedItems,
): LicenseResolvedItems {
	const result: LicenseResolvedItems = {};

	for (const [key, list] of entries(current ?? {})) {
		const stamps = new Map((removed[key] ?? []).map((entry) => [entry.id, entry.resolved_at]));
		const remaining = (list ?? []).filter((entry) => stamps.get(entry.id) !== entry.resolved_at);

		if (remaining.length > 0) result[key] = remaining;
	}

	return result;
}
