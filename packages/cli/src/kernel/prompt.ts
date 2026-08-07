import { isCancel, password, text, type TextOptions } from '@clack/prompts';
import { CliError } from './error.js';
import { registerSecret } from './secret.js';

/**
 * Await a clack prompt and unwrap it, turning a cancel (Ctrl+C / Esc) into a clean
 * exit through the normal error boundary instead of clack's own process.exit.
 */
export async function ask<T>(prompt: Promise<T | symbol>): Promise<T> {
	const value = await prompt;
	if (isCancel(value)) throw new CliError('USAGE', 'Cancelled.');
	return value as T;
}

/**
 * Resolve a required value from arguments or an interactive prompt. Without a terminal the value can only
 * come from the arguments, so `usage` — and `hint`, when the value has more than one invocation shape —
 * is what the resulting error says instead.
 */
export async function orPrompt(
	value: string | undefined,
	interactive: boolean,
	usage: string,
	options: TextOptions,
	hint?: string,
): Promise<string> {
	if (value !== undefined) return value;
	if (!interactive) throw new CliError('USAGE', usage, { hint });
	return ask(text(options));
}

/**
 * Registration is part of this call, not the caller's job: a token that reached the process without
 * reaching the redaction registry can print in full, and a caller that has to remember will eventually not.
 */
export async function promptAndRegisterToken(profileName: string): Promise<string> {
	const token = await ask(
		password({
			message: `Paste a token for "${profileName}"`,
			validate: (value) => (value !== undefined && value.trim() !== '' ? undefined : 'Paste a non-empty token.'),
		}),
	);

	registerSecret(token);
	return token;
}

/** Collect login credentials; the caller opens the session with them. */
export async function promptLogin(): Promise<{ email: string; password: string }> {
	const email = await ask(
		text({ message: 'Email', validate: (v) => (v?.includes('@') ? undefined : 'Enter a valid email.') }),
	);

	const secret = await ask(password({ message: 'Password' }));
	return { email, password: secret };
}
