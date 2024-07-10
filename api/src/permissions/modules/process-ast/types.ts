export type CollectionKey = string;
export type FieldKey = string;
export type QueryPath = string[];

/**
 * Key is dot-notation QueryPath, f.e. `category.created_by`.
 * Value contains collection context for that path, and fields fetched within
 */
export type FieldMapEntries = Map<string, { collection: CollectionKey; fields: Set<FieldKey> }>;

/**
 * FieldMapEntries that require only read permissions and those that require action specific permissions
 */
export type FieldMap = {
	read: FieldMapEntries;
	other: FieldMapEntries;
};

export interface AccessRow {
	policy: { id: string; ip_access: string[] | null };
}
