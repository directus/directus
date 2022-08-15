import { defineOperationApi } from '@directus/shared/utils';
import { NodeVM, VMScript } from 'vm2';

type Options = {
	code: string;
};

export default defineOperationApi<Options>({
	id: 'exec',
	handler: async ({ code }, { data }) => {
		const vm = new NodeVM({
			eval: false,
			wasm: false,
			require: false,
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
			return await fn(data);
		} catch (err) {
			console.log(err);
			throw new Error(`Couldn't run code.`);
		}
	},
});
