/** Exclude entities Directus doesn't manage (i.e. an untracked table/column). */
export function isManaged(item: { meta: unknown | null } | null) {
	if (item?.meta === null) return false;
	return true;
}
