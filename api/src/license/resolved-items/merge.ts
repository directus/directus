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

export function removeResolvedIds(
	current: LicenseResolvedItems | null,
	removed: LicenseRestoreInput,
): LicenseResolvedItems {
	const result: LicenseResolvedItems = {};

	for (const [key, list] of entries(current ?? {})) {
		const ids = removed[key] ?? [];
		const remaining = (list ?? []).filter((entry) => !ids.includes(entry.id));

		if (remaining.length > 0) result[key] = remaining;
	}

	return result;
}
