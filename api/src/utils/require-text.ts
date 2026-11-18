import { readFileSync } from 'node:fs';

export function requireText(filepath: string): string {
	return readFileSync(filepath, 'utf8');
}
