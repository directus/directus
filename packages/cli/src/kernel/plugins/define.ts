import type { z } from 'zod';
import type { CliContext } from '../context.js';
import type { CliError, Result } from '../result.js';

export interface CommandContext<Args> {
	readonly args: Args;
	readonly positionals: string[];
	readonly ctx: CliContext;
}

// A command may return nothing (success) or a Result the kernel unwraps at the
// boundary. Plugin run() may also throw — the kernel normalizes both.
export type CommandOutcome = void | Result<void, CliError>;

export interface CommandDefinition<Schema extends z.ZodObject = z.ZodObject> {
	readonly name: string;
	readonly description: string;
	readonly args: Schema;
	// Method syntax (not an arrow property) is deliberate: it keeps the schema
	// generic bivariant so a specific command is assignable to the erased
	// CommandDefinition the registry stores. Safe because the kernel is the sole
	// caller and always supplies the full parsed args object, never a narrower
	// one — do not "fix" this into an arrow property, it breaks registry storage.
	run(context: CommandContext<z.infer<Schema>>): CommandOutcome | Promise<CommandOutcome>;
}

export function defineCommand<Schema extends z.ZodObject>(
	definition: CommandDefinition<Schema>,
): CommandDefinition<Schema> {
	return definition;
}

// A plugin manifest stays cheap: names + one-line summaries. Command bodies
// (schema + run + imports) load lazily so `--help` never pays for code it
// won't run.
export interface CommandManifestEntry {
	readonly summary: string;
	load(): Promise<CommandDefinition>;
}

export interface PluginDefinition {
	readonly name: string;
	readonly description: string;
	readonly commands: Record<string, CommandManifestEntry>;
}

export function definePlugin(definition: PluginDefinition): PluginDefinition {
	return definition;
}
