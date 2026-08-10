/** Shared by configuration validation and the commands' `--mode` choices. */
export const MODES = ['add', 'merge', 'mirror'] as const;

export type SyncMode = (typeof MODES)[number];

import type { ImportBatchMode, SnapshotDiffMode } from '@directus/types';

/** Narrower than SyncMode: `add` has no schema meaning. */
export type SchemaDiffMode = SnapshotDiffMode;

/** Narrower than SyncMode: mirror rides as merge plus delete permission. */
export type ImportMode = ImportBatchMode;

const MODE_DESCRIPTIONS: Record<SyncMode, string> = {
	add: 'add — only creates new records',
	merge: 'merge — creates and updates records, never deletes',
	mirror: 'mirror — INCLUDES DELETIONS',
};

export function describeMode(mode: SyncMode): string {
	return MODE_DESCRIPTIONS[mode];
}
