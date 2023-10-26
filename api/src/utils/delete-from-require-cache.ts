import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export function deleteFromRequireCache(modulePath: string): void {
	delete require.cache[require.resolve(modulePath)];
}
