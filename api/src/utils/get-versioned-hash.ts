import hash from 'object-hash';
import { version } from '../../package.json';

export function getVersionedHash(item: Record<string, any>): string {
	return hash({ item, version });
}
