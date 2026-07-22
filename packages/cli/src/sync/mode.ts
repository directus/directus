/** User-facing sync modes, shared by config validation and command choices. */
export const MODES = ['add', 'merge', 'mirror'] as const;

/** A supported user-facing sync mode. */
export type Mode = (typeof MODES)[number];
