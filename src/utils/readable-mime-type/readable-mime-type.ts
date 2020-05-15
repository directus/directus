import types from './types.json';

export default function readableMimeType(type: string) {
	return (types as any)[type] || null;
}
