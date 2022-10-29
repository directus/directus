import { defineOperationApi, toArray } from '@directus/shared/utils';
import { NodeVM, NodeVMOptions, VMScript } from 'vm2';

type Options = {
	code: string;
};

export default defineOperationApi<Options>({
	id: 'exec',
	handler: async ({ code }, { data, env }) => {
		const allowedModules = env.FLOWS_EXEC_ALLOWED_MODULES ? toArray(env.FLOWS_EXEC_ALLOWED_MODULES) : [];
		const allowedEnv = data.$env ?? {};

		const opts: NodeVMOptions = {
			eval: false,
			wasm: false,
			env: allowedEnv,
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

		const script = new VMScript(code).compile();
		const fn = await vm.run(script);

		return await fn(data);
	},
});
