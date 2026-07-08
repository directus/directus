// Public API surface for command authors. Treated as internal and unstable until
// the command API is deliberately made public.
export type { CliContext, CommandContext, CommandDefinition, CommandGroup } from './kernel/command.js';
export { defineCommand } from './kernel/command.js';
export type { CliErrorCode } from './kernel/error.js';
export { CliError, isCliError } from './kernel/error.js';
export type { Ui } from './kernel/ui.js';
export { version } from './version.js';
