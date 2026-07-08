import type { Ui } from './ui.js';

// Passed to every command's run(). The SDK client factory, resolved config, and
// profile/credential resolution attach here as those kernel layers are built.
export interface CliContext {
	readonly cwd: string;
	readonly json: boolean;
	readonly ui: Ui;
}
