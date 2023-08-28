import type { Context } from 'isolated-vm';
import type { ApiExtensionInfo } from '../../vm.js';
import { VMFunction } from '../vm-function.js';
import { createRequire } from 'module';
import { getFlowManager } from '../../../flows.js';
import env from '../../../env.js';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');

export class DefineOperationVMFunction extends VMFunction {
	override prepareContext(context: Context, _extension: ApiExtensionInfo): void {
		context.evalClosure(this.readV8Code(import.meta.url), [
			ivm,
			new ivm.Reference(async function (id: string, handler: any) {
				const scriptTimeoutMs = Number(env['EXTENSIONS_SECURE_TIMEOUT']);

				const flowManager = getFlowManager();

				flowManager.addOperation(id, async (options, flowContext) => {
					const result = await handler.apply(null, [
						new ivm.ExternalCopy(options).copyInto(),
						new ivm.ExternalCopy({ data: flowContext.data }).copyInto(),
					], { timeout: scriptTimeoutMs });

					if (result instanceof Error) {
						throw result;
					}

					return result;
				});
			}),
		]);
	}
}
