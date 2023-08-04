import { defineOperationApi } from '@directus/utils';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');

type Options = {
	code: string;
};

export default defineOperationApi<Options>({
	id: 'exec',
	handler: async ({ code }, { data, env }) => {
		const allowedEnv = data['$env'] ?? {};
		const isolateSizeMb = env['FLOWS_MAX_MEMORY_MB'];
		const scriptTimeoutMs = env['FLOWS_TIMEOUT_MS'];

		const isolate = new ivm.Isolate({ memoryLimit: isolateSizeMb });
		const context = isolate.createContextSync();
		const jail = context.global;
		jail.setSync('global', jail.derefInto());
		jail.setSync('process', { env: allowedEnv }, { copy: true });
		jail.setSync('module', { exports: null }, { copy: true });

		// We run the operation once to define the module.exports function
		await context.eval(code, { timeout: scriptTimeoutMs });

		const inputData = new ivm.ExternalCopy({ data });
		const resultRef = await context.evalClosure(`return module.exports($0.data)`, [inputData.copyInto()], {
			result: { reference: true, promise: true },
			timeout: scriptTimeoutMs,
		});
		const result = await resultRef.copy();

		// Memory cleanup
		resultRef.release();
		inputData.release();
		context.release();
		isolate.dispose();

		return result;
	},
});
