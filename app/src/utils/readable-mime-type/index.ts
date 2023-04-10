import extensions from './extensions.json';
import types from './types.json';

export function readableMimeType(type: string, extension = false): string | null {
	if (extension) {
		return (extensions as any)[type] || null;
	}

	return (types as any)[type] || null;
}
