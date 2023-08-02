import { defineOperationApi } from '@directus/utils';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');

type Options = {
	code: string;
};

export default defineOperationApi<Options>({
	id: 'exec',
	handler: async ({ code }, { data, env, logger }) => {
		const allowedEnv = data['$env'] ?? {};
		const isolateSizeMb = env['FLOWS_ISOLATE_MAX_MEMORY_MB'];
		const scriptTimeoutMs = env['FLOWS_SCRIPT_TIMEOUT_MS'];

		const isolate = new ivm.Isolate({ memoryLimit: isolateSizeMb });

		const context = isolate.createContextSync();
		const jail = context.global;
		jail.setSync('global', jail.derefInto());

		// We will create a basic `log` function for the new isolate to use.
		// TODO: This is just for testing, else the logs get swallowed inside the isolate.
		jail.setSync('log', function (...args: any[]) {
			console.log(...args);
		});
		jail.setSync('process', { env: allowedEnv }, { copy: true });
		jail.setSync('module', { exports: null }, { copy: true });

		// We run the operation once to define the module.exports function
		const hostile = await isolate.compileScript(code).catch((err: any) => {
			logger.error(err);
			throw err;
		});
		await hostile.run(context, { timeout: scriptTimeoutMs }).catch((err: any) => {
			logger.error(err);
			throw err;
		});

		const inputData = new ivm.Reference({ data });
		const resultRef = await context
			.evalClosure(`return module.exports($0.copySync().data)`, [inputData], {
				result: { reference: true, promise: true },
				timeout: scriptTimeoutMs,
			})
			.catch((err: any) => {
				logger.error(err);
				throw err;
			});
		const result = resultRef.copySync(); // TODO: Could be async

		// Memory cleanup
		resultRef.release();
		inputData.release();
		hostile.release();
		context.release();
		isolate.dispose();

		return result;
	},
});
