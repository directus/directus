import fs from 'node:fs/promises';
import path from 'node:path';
import { assert, describe, it } from 'vitest';

/**
 * The SDK compiles with the DOM lib, but consumers are not required to. Naming a DOM global in
 * the public types therefore leaves it unresolved in the published `.d.ts` for anyone building
 * without it, which is reported as `TS2304: Cannot find name ...`.
 *
 * These two were the reported cases. `RequestCredentials` has no equivalent in `@types/node`,
 * and the DOM's `MessageEvent` is generic while the Node global is not, so `MessageEvent<T>`
 * fails there as `TS2315: Type 'MessageEvent' is not generic`. Both are declared in
 * `src/types/globals.ts` instead.
 */
describe('DOM-free published types', () => {
	it.each([
		{
			name: 'RequestCredentials',
			// Allowed through an explicit import of the SDK's own declaration.
			pattern: /\bRequestCredentials\b/,
			importPattern: /import type \{[^}]*\bRequestCredentials\b[^}]*\} from '[^']*types\/globals\.js'/,
		},
		{
			name: 'MessageEvent',
			// `MessageEventInterface` is the replacement, so it must not match.
			pattern: /\bMessageEvent\b(?!Interface)/,
			importPattern: /$^/,
		},
	])('does not name the DOM global $name', async ({ name, pattern, importPattern }) => {
		const offenders: string[] = [];

		for await (const file of sourceFiles()) {
			// The declaration itself lives here.
			if (file === path.join('types', 'globals.ts')) continue;

			const contents = await fs.readFile(path.join(srcRoot, file), 'utf8');
			if (!pattern.test(contents)) continue;
			if (importPattern.test(contents)) continue;

			offenders.push(file);
		}

		assert(
			offenders.length === 0,
			`${offenders.join(', ')} name the DOM global "${name}" without importing the SDK's own ` +
				`declaration from types/globals.ts, so the published types will not resolve without the DOM lib`,
		);
	});
});

const srcRoot = path.resolve(path.join(import.meta.dirname, '..', 'src'));

function sourceFiles() {
	return fs.glob('**/*.ts', { cwd: srcRoot });
}
