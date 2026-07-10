import type { z } from 'zod';
import type { Ui } from './ui.js';

// Passed to every command's run(). Stays lean — the SDK client and resolved
// config attach via kernel helpers commands call on demand, not off ctx.
export interface CliContext {
	readonly cwd: string;
	// Explicit --config path (resolved against cwd); undefined means walk-up
	// discovery. Commands pass it through to loadConfig and the profile writers.
	readonly configPath: string | undefined;
	readonly ui: Ui;
	// True only in a real TTY that isn't CI, --json, or --no-interactive. Commands
	// gate every prompt on this; an agent driving the CLI never hits one.
	readonly interactive: boolean;
}

export interface CommandContext<Args> {
	readonly args: Args;
	readonly positionals: string[];
	readonly ctx: CliContext;
}

export interface CommandDefinition<Schema extends z.ZodObject = z.ZodObject> {
	readonly name: string;
	readonly description: string;
	readonly args: Schema;
	// Method syntax (not an arrow property) keeps the schema generic bivariant so a
	// specific command stays assignable to the erased CommandDefinition a group
	// stores. The kernel is the sole caller and always passes the full parsed args
	// — do not switch this to an arrow property, it breaks group storage.
	run(context: CommandContext<z.infer<Schema>>): void | Promise<void>;
}

// A group namespaces related commands under one word: `d6s profile add`. Built in
// and bundled — no dynamic loading, no third-party plugin surface.
export interface CommandGroup {
	readonly name: string;
	readonly description: string;
	readonly commands: Record<string, CommandDefinition>;
}
