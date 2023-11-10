import { afterEach, vi } from 'vitest';

let env = {};

export function setEnv(newEnv: Record<string, string>) {
	env = { ...env, ...newEnv };
}

/** Static env mock - to be used inside `vi.mock` */
export async function mockEnv(options?: { env?: Record<string, string>; withDefaults?: boolean }) {
	const initialEnv = options?.env ?? {};
	const withDefaults = options && 'withDefaults' in options ? options.withDefaults : true;

	env = { ...initialEnv };

	afterEach(() => {
		env = { ...initialEnv };
	});

	const { defaults, processValues } = await vi.importActual<typeof import('../env.js')>('../env.js');

	return {
		get default() {
			return processValues({ ...(withDefaults && defaults), ...env });
		},
	};
}

/** Dynamic env mock */
export function doMockEnv(options?: { env?: Record<string, string>; withDefaults?: boolean }) {
	const initialEnv = options?.env ?? {};
	const withDefaults = options && 'withDefaults' in options ? options.withDefaults : true;

	let env = { ...initialEnv };

	vi.doMock('../env.js', async () => {
		const { defaults, processValues } = await vi.importActual<typeof import('../env.js')>('../env.js');

		return {
			get default() {
				return processValues({ ...(withDefaults && defaults), ...env });
			},
		};
	});

	afterEach(() => {
		env = { ...initialEnv };
	});

	return { env, setEnv };

	function setEnv(newEnv: Record<string, string>) {
		env = { ...env, ...newEnv };
	}
}
