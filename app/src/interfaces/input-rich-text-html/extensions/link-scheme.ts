const SCHEME = /^[a-z][a-z0-9+.-]*$/;
const BLOCKED_SCHEMES = new Set(['javascript', 'vbscript', 'data']);

export type LinkSchemeProblem = 'blocked' | 'invalid';

/** Normalises a `linkProtocols` entry (`MyApp://` → `myapp`) and reports why it cannot be allowed, if it cannot. */
export function checkLinkScheme(entry: string): { scheme: string; problem: LinkSchemeProblem | null } {
	const scheme = entry.trim().toLowerCase().replace(/:\/*$/, '');
	if (BLOCKED_SCHEMES.has(scheme)) return { scheme, problem: 'blocked' };
	return { scheme, problem: SCHEME.test(scheme) ? null : 'invalid' };
}

export function hasBlockedScheme(url: string): boolean {
	const scheme = /^\s*([a-z][a-z0-9+.-]*):/i.exec(url)?.[1];
	return scheme !== undefined && BLOCKED_SCHEMES.has(scheme.toLowerCase());
}
