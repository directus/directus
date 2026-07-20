import { isCancel, password, text, type TextOptions } from '@clack/prompts';
import { saveCredential } from './config/credentials.js';
import { type Identity, loginSession } from './connection.js';
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

// Resolve a required value from arguments or an interactive prompt.
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

// Register before any later operation can render the token.
export async function promptToken(profileName: string): Promise<string> {
	const token = await ask(password({ message: `Paste a token for "${profileName}"` }));
	registerSecret(token);
	return token;
}

export function saveToken(ui: Ui, url: string, profileName: string, token: string): void {
	saveCredential(url, profileName, token);
	ui.success(`Saved a token for "${profileName}" to the credential store.`);
}

export async function promptLogin(url: string, profileName: string): Promise<Identity> {
	const email = await ask(
		text({ message: 'Email', validate: (v) => (v?.includes('@') ? undefined : 'Enter a valid email.') }),
	);

	const pass = await ask(password({ message: 'Password' }));
	return loginSession(url, profileName, email, pass);
}
