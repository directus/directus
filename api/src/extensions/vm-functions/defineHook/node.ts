import type { Context } from "isolated-vm";
import type { ApiExtensionInfo } from "../../vm.js";
import { VMFunction } from "../vm-function.js";
import emitter from '../../../emitter.js';
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')

export class DefineHookVMFunction extends VMFunction {

	override prepareContext(context: Context, extension: ApiExtensionInfo): void {

		context.evalClosure(this.readV8Code(import.meta.url), [
			ivm,
			new ivm.Reference(async function (type: 'filter' | 'action', event: string, callback: any) {
				if (type === 'filter') {
					emitter.onFilter(event, (payload, meta, filterContext) => {
						console.log('filter', event, payload, meta)
						callback.apply(null, [
							new ivm.ExternalCopy(payload).copyInto(),
							new ivm.ExternalCopy(meta).copyInto(),
						])
					});
				} else if (type === 'action') {
					emitter.onAction(event, (meta, filterContext) => {
						console.log('action', event, meta)
						callback.apply(null, [
							new ivm.ExternalCopy(meta).copyInto(),
						])
					});
				}
			})
		])
	}

}
