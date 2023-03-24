import hash from 'object-hash';
import { version } from './package.js';

export function getVersionedHash(item: Record<string, any>): string {
	return hash({ item, version });
}
