import { defineOperationApi } from '@directus/shared/utils';
import { NodeVM, VMScript } from 'vm2';

type Options = {
	code: string;
};

export default defineOperationApi<Options>({
	id: 'exec',
	handler: async ({ code }, { data }) => {
		// This a very nasty workaround to get around TypeScript auto converting async imports to
		// require.. npx-import is ESM only, so needs to be required through await import() in CJS
		const { npxImport } = await (new Function('return import("npx-import")')() as Promise<typeof import('npx-import')>);

		const vm = new NodeVM({
			sandbox: {
				npxImport,
			},
			eval: false,
			wasm: false,
		});

		let script;

		try {
			script = new VMScript(code).compile();
		} catch (err) {
			console.log(err);
			throw new Error(`Couldn't compile code.`);
		}

		try {
			const fn = await vm.run(script);
			const res = await fn(data);
			return res;
		} catch (err) {
			console.log(err);
			throw new Error(`Couldn't run code.`);
		}
	},
});
