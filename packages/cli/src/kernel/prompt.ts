import { isCancel, password, text, type TextOptions } from '@clack/prompts';
import { saveCredential } from './config/credentials.js';
import { CliError } from './error.js';
import { registerSecret } from './secret.js';
import type { Ui } from './ui.js';

// Await a clack prompt and unwrap it, turning a cancel (Ctrl+C / Esc) into a clean
// exit through the normal error boundary instead of clack's own process.exit.
export async function ask<T>(prompt: Promise<T | symbol>): Promise<T> {
	const value = await prompt;
	if (isCancel(value)) throw new CliError('USAGE', 'Cancelled.');
	return value as T;
}

// A required string argument: use the given value, prompt for it when interactive,
// or fail with a usage error non-interactively. Keeps the flag/prompt/error fallback
// in one place instead of repeating it per field.
export async function orPrompt(
	value: string | undefined,
	interactive: boolean,
	usage: string,
	options: TextOptions,
): Promise<string> {
	if (value !== undefined) return value;
	if (!interactive) throw new CliError('USAGE', usage);
	return ask(text(options));
}

// Prompt for a token (masked) and register it for redaction the instant it lands.
// Input-only clack use: the value is never printed, only captured. Whether to persist
// it is the caller's call.
export async function promptToken(profileName: string): Promise<string> {
	const token = await ask(password({ message: `Paste a token for "${profileName}"` }));
	registerSecret(token);
	return token;
}

// Persist a token to the store (0600) and confirm it — the one place the save write
// and its "saved" message live together, shared by `profile add` and `profile test`.
export function saveToken(ui: Ui, url: string, profileName: string, token: string): void {
	saveCredential(url, profileName, token);
	ui.success(`Saved a token for "${profileName}" to the credential store.`);
}
