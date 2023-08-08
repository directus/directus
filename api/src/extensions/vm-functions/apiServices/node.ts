import type { Context } from "isolated-vm";
import type { ApiExtensionInfo } from "../../vm.js";
import { VMFunction } from "../vm-function.js";
import { createRequire } from "node:module";
import { ItemsService } from "../../../services/items.js";
import { getSchema } from "../../../utils/get-schema.js";


const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')


export class ApiServiceVMFunction extends VMFunction {
	constructor() {
		super(import.meta.url)
	}

	override async prepareContext(context: Context, extension: ApiExtensionInfo): Promise<void> {

		const schema = await getSchema()

		context.evalClosure(this.vmCode, [
			ivm,
			new ivm.Reference(function (type: 'items', collection: string) {
				console.log("Api Service: ", type)

				if (type === 'items') {
					const itemsService = new ItemsService(collection, {
						schema: schema
					})

					return new ivm.Reference(function (resolve: any, reject: any, prop: string, args: any[]) {

						if (prop in itemsService === false) {
							reject.apply(null, [new ivm.ExternalCopy(new Error('Method does not exist on service')).copyInto()])
							return
						}

						itemsService[prop](...args).then((result) => {
							resolve.apply(null, [new ivm.ExternalCopy(result).copyInto()])
						}).catch((err) => {
							reject.apply(null, [new ivm.ExternalCopy(err).copyInto()])
						})
					})
				}


			})
		])
	}
}
