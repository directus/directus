import type { ImportBatchMode, SnapshotDiffMode } from '@directus/types';

export const MODES = ['add', 'merge', 'mirror'] as const;

export type SyncMode = (typeof MODES)[number];

export type SchemaDiffMode = SnapshotDiffMode;

export type ImportMode = ImportBatchMode;

const MODE_DESCRIPTIONS: Record<SyncMode, string> = {
	add: 'add — only creates new records',
	merge: 'merge — creates and updates records, never deletes',
	mirror: 'mirror — INCLUDES DELETIONS',
};

export function describeMode(mode: SyncMode): string {
	return MODE_DESCRIPTIONS[mode];
}
