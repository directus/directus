/** User-facing sync modes, shared by configuration validation and command choices. */
export const MODES = ['add', 'merge', 'mirror'] as const;

/** A supported user-facing sync mode. */
export type SyncMode = (typeof MODES)[number];

/** The subset the schema diff endpoint accepts; `add` has no schema meaning. */
export type SchemaDiffMode = 'merge' | 'mirror';

/** The subset the import endpoint accepts; mirror rides as merge plus delete permission. */
export type ImportMode = 'add' | 'merge';

const MODE_DESCRIPTIONS: Record<SyncMode, string> = {
	add: 'add — only creates new records',
	merge: 'merge — creates and updates records, never deletes',
	mirror: 'mirror — INCLUDES DELETIONS',
};

/** The mode with its one-line meaning, for target lines and prompts. */
export function describeMode(mode: SyncMode): string {
	return MODE_DESCRIPTIONS[mode];
}
