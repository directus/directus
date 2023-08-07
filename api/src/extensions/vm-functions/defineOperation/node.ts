import type { Context } from "isolated-vm";
import type { ApiExtensionInfo } from "../../vm.js";
import { VMFunction } from "../vm-function.js";
import { createRequire } from "module";
import { getFlowManager } from "../../../flows.js";

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')


export class DefineOperationVMFunction extends VMFunction {

	constructor() {
		super(import.meta.url)
	}

	override prepareContext(context: Context, extension: ApiExtensionInfo): void {

		context.evalClosure(this.vmCode, [
			ivm,
			new ivm.Reference(async function (id: string, handler: any) {
				console.log("register operation", id)
				const flowManager = getFlowManager();

				flowManager.addOperation(id, (options, context) => {
					console.log('operation', id, options)

					handler.apply(null, [
						new ivm.ExternalCopy(options).copyInto(),
						new ivm.ExternalCopy({}).copyInto(),
					])
				})
			})
		])

	}

}
