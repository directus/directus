import type { Context } from 'isolated-vm';
import type { ApiExtensionInfo } from '../../vm.js';
import { VMFunction } from '../vm-function.js';
import { createRequire } from 'module';
import logger from '../../../logger.js';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');

export class LoggerVMFunction extends VMFunction {
	override prepareContext(context: Context, extension: ApiExtensionInfo): void {
		context.evalClosureSync(this.readV8Code(import.meta.url), [
			new ivm.ExternalCopy({
				// TODO:
				// Change the function signature to be actually compatible
				// See what happens with errors!

				info: new ivm.Callback((...args: any[]) => logger.info('%s: %o', extension.name, args)),
				warn: new ivm.Callback((...args: any[]) => logger.warn('%s: %o', extension.name, args)),
				error: new ivm.Callback((...args: any[]) => logger.error('%s: %o', extension.name, args)),
				trace: new ivm.Callback((...args: any[]) => logger.trace('%s: %o', extension.name, args)),
				debug: new ivm.Callback((...args: any[]) => logger.debug('%s: %o', extension.name, args)),
				fatal: new ivm.Callback((...args: any[]) => logger.fatal('%s: %o', extension.name, args)),
			}).copyInto()
		]);
	}
}
