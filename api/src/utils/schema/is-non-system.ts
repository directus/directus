/** Exclude system collections/fields */
export function isNonSystem(item: { meta: { system?: boolean | null } | null }) {
	if (item?.meta?.system === true) return false;
	return true;
}
