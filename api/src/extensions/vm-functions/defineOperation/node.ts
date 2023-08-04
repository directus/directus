import type { Context } from "isolated-vm";
import type { ApiExtensionInfo } from "../../vm.js";
import { VMFunction } from "../vm-function.js";


export class DefineOperationVMFunction extends VMFunction {

	constructor() {
		super(import.meta.url)
	}

	override prepareContext(context: Context, extensionName: ApiExtensionInfo): void {
		throw new Error("Method not implemented.");
	}

}
