/** Keep indexed system fields, whose indexes must be preserved even though system entities are otherwise excluded. */
export function isIndexedSystemField(item: {
	meta: { system?: boolean | null } | null;
	schema: { is_indexed: boolean } | null;
}) {
	return item.meta?.system === true && item.schema?.is_indexed;
}
