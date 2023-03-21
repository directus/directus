import { defineOperationApi, toArray } from '@directus/shared/utils';
import { NodeVM, NodeVMOptions, VMScript } from 'vm2';
import { isBuiltin } from 'node:module';

type Options = {
	code: string;
};

export default defineOperationApi<Options>({
	id: 'exec',
	handler: async ({ code }, { data, env }) => {
		const allowedModules = env.FLOWS_EXEC_ALLOWED_MODULES ? toArray(env.FLOWS_EXEC_ALLOWED_MODULES) : [];
		const allowedModulesBuiltIn: string[] = [];
		const allowedModulesExternal: string[] = [];
		const allowedEnv = data.$env ?? {};

		const opts: NodeVMOptions = {
			eval: false,
			wasm: false,
			env: allowedEnv,
		};

		for (const module of allowedModules) {
			if (isBuiltin(module)) {
				allowedModulesBuiltIn.push(module);
			} else {
				allowedModulesExternal.push(module);
			}
		}

		if (allowedModules.length > 0) {
			opts.require = {
				builtin: allowedModulesBuiltIn,
				external: {
					modules: allowedModulesExternal,
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
