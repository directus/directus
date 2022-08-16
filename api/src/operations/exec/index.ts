import { defineOperationApi, toArray } from '@directus/shared/utils';
import { NodeVM, NodeVMOptions, VMScript } from 'vm2';
import env from '../../env';

type Options = {
	code: string;
};

export default defineOperationApi<Options>({
	id: 'exec',
	handler: async ({ code }, { data }) => {
		const allowedModules = env.FLOWS_EXEC_ALLOWED_MODULES ? toArray(env.FLOWS_EXEC_ALLOWED_MODULES) : [];

		const opts: NodeVMOptions = {
			eval: false,
			wasm: false,
		};

		if (allowedModules.length > 0) {
			opts.require = {
				external: {
					modules: allowedModules,
					transitive: false,
				},
			};
		}

		const vm = new NodeVM(opts);

		let script;

		try {
			script = new VMScript(code).compile();
		} catch (err: any) {
			throw new Error(`Couldn't compile code: ${err?.message}`);
		}

		try {
			const fn = await vm.run(script);
			return await fn(data);
		} catch (err: any) {
			throw new Error(`Couldn't run code: ${err?.message}`);
		}
	},
});
