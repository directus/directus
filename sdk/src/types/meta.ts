/**
 * Standard Directus response metadata for paginated queries.
 */
export interface DirectusMeta {
	/** Total item count of the collection (without filters). */
	total_count?: number;
	/** Item count with current filter/search applied. */
	filter_count?: number;
}
