import type { z } from 'zod';
import type { Ui } from './ui.js';

// Passed to every command's run(). Stays lean — the SDK client and resolved
// config attach via kernel helpers commands call on demand, not off ctx.
export interface CliContext {
	readonly cwd: string;
	readonly ui: Ui;
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
