import type { PrimaryKey } from './items.js';

/** A collection and the flat rows to import into it. */
export interface ImportCollectionData {
	collection: string;
	items: Record<string, unknown>[];
}

/** Batch import mode: `add` inserts (remapping conflicting keys), `merge` upserts on the existing key. */
export type ImportBatchMode = 'add' | 'merge';

export interface ImportBatchOptions {
	mode?: ImportBatchMode;
	dryRun?: boolean;
	/**
	 * When combined with `mode: 'merge'`, delete every existing record in an imported collection
	 * whose primary key is not present in the import (a destructive mirror). No effect on its own.
	 */
	dangerouslyAllowDelete?: boolean;
}

export interface ImportBatchCollectionResult {
	existing: PrimaryKey[];
	new: PrimaryKey[];
	deleted: PrimaryKey[];
	mapped: Record<string, PrimaryKey>;
}

export interface ImportBatchResult {
	applied: boolean;
	mode: ImportBatchMode;
	collections: Record<string, ImportBatchCollectionResult>;
}
