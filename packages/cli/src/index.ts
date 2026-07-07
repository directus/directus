// Public API surface for plugin authors. Treated as internal and unstable until
// the plugin API is deliberately made public.
export type { CliContext } from './kernel/context.js';
export type {
	CommandContext,
	CommandDefinition,
	CommandManifestEntry,
	CommandOutcome,
	PluginDefinition,
} from './kernel/plugins/define.js';
export { defineCommand, definePlugin } from './kernel/plugins/define.js';
export type { CliError, CliErrorCode, Result } from './kernel/result.js';
export { cliError, err, isCliError, ok } from './kernel/result.js';
export type { Ui } from './kernel/ui.js';
export { version } from './version.js';
