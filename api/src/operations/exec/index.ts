import { defineOperationApi, toArray } from '@directus/shared/utils';
import { NodeVM, VM, VMOptions, VMScript } from 'vm2';
import env from '../../env';

type Options = {
	code: string;
};

export default defineOperationApi<Options>({
	id: 'exec',
	handler: async ({ code }, { data }) => {
		const allowedModules = env.FLOWS_EXEC_ALLOWED_MODULES ? toArray(env.FLOWS_EXEC_ALLOWED_MODULES) : [];

		const opts: VMOptions = {
			eval: false,
			wasm: false,
		};

		const vm = allowedModules.length
			? new NodeVM({ ...opts, require: { external: { modules: allowedModules, transitive: false } } })
			: new VM(opts);

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
