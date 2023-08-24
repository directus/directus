import type { Context } from 'isolated-vm';
import type { ApiExtensionInfo } from '../../vm.js';
import { VMFunction } from '../vm-function.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');

export class ConsoleVMFunction extends VMFunction {
	override prepareContext(context: Context, extension: ApiExtensionInfo): void {
		const jail = context.global;

		jail.setSync(
			'console',
			new ivm.ExternalCopy({
				log: new ivm.Callback((...args: any[]) => {
					// @ts-ignore
					console.log(`${extension.name}: `, ...args);
				}),
				error: new ivm.Callback((...args: any[]) => {
					// @ts-ignore
					console.error(`${extension.name}: `, ...args);
				}),
				warn: new ivm.Callback((...args: any[]) => {
					// @ts-ignore
					console.warn(`${extension.name}: `, ...args);
				}),
			}).copyInto()
		);
	}
}
