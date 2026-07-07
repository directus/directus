import type { Ui } from './ui.js';

// Passed to every command's run(). The SDK client factory, resolved config, and
// profile/credential resolution attach here as those kernel layers are built.
export interface CliContext {
	readonly cwd: string;
	readonly json: boolean;
	readonly ui: Ui;
}

export function createContext(options: { cwd: string; json: boolean; ui: Ui }): CliContext {
	return { cwd: options.cwd, json: options.json, ui: options.ui };
}
