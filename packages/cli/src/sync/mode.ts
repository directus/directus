/** User-facing sync modes, shared by config validation and command choices. */
export const MODES = ['add', 'merge', 'mirror'] as const;

/** A supported user-facing sync mode. */
export type Mode = (typeof MODES)[number];

// One gloss per mode, shown wherever a mode is echoed: a first-time operator must never need to already
// know that "mirror" deletes.
const MODE_GLOSSES: Record<Mode, string> = {
	add: 'add — only creates new records',
	merge: 'merge — additive, no deletions',
	mirror: 'mirror — INCLUDES DELETIONS',
};

/** The mode with its one-line meaning, for target lines and prompts. */
export function describeMode(mode: Mode): string {
	return MODE_GLOSSES[mode];
}
