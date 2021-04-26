import types from './types.json';
import extensions from './extensions.json';

export default function readableMimeType(type: string, extension = false): string | null {
	if (extension) {
		return (extensions as any)[type] || null;
	}

	return (types as any)[type] || null;
}
