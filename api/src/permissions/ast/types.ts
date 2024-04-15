export type CollectionKey = string;
export type FieldKey = string;
export type QueryPath = string[];

/**
 * Key is dot-notation QueryPath, f.e. `category.created_by`.
 * Value contains collection context for that path, and fields fetched within
 */
export type FieldMap = Map<string, { collection: CollectionKey; fields: Set<FieldKey> }>;

export interface AccessRow {
	policy: { id: string; admin_access: boolean; ip_access: string | null };
	sort: number;
	role: null | string;
	user: null | string;
}
