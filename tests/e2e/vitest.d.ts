import 'vitest';

interface CustomMatchers<R = unknown> {
	toBeFoo: () => R;
}

declare module 'vitest' {
	type Matchers<T = any> = CustomMatchers<T>;

	export interface ProvidedContext {
		API_KEY: string;
	}
}

// mark this file as a module so augmentation works correctly
export {};
