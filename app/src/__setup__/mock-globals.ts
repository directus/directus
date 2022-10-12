import { afterEach } from 'vitest';

const originals = new Map<string, any>();

originals.set('createObjectURL', globalThis.URL.createObjectURL);

Object.defineProperty(globalThis.URL, 'createObjectURL', {
	value: () => 'blob:http://localhost/0',
	writable: true,
	enumerable: false,
	configurable: true,
});

afterEach(() => {
	Object.defineProperty(globalThis.URL, 'createObjectURL', {
		value: originals.get('createObjectURL'),
		writable: true,
		enumerable: false,
		configurable: true,
	});
});
