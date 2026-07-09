// Minimal programmatic surface for embedding the CLI — error handling and version.
// Internal and unstable.
export type { CliErrorCode } from './kernel/error.js';
export { CliError, isCliError } from './kernel/error.js';
export { version } from './version.js';
