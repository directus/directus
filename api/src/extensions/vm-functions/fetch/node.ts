import type { Context } from "isolated-vm";
import type { ApiExtensionInfo } from "../../vm.js";
import { VMFunction } from "../vm-function.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')

export class FetchVMFunction extends VMFunction {

	constructor() {
		super(import.meta.url)
	}

	override prepareContext(context: Context, extension: ApiExtensionInfo): void {
		const permissions = extension.granted_permissions

		context.evalClosure(this.vmCode, [
			ivm,
			new ivm.Reference(async function (url: string, options: any, resolve: any, reject: any) {
				if (permissions.find(permission => permission.permission === "web") === undefined) {
					reject.apply(undefined, [
						new ivm.ExternalCopy(new Error("Permission denied")).copyInto()
					], {
						timeout: 1000
					})
				}

				try {
					const response = await fetch(url, options)

					resolve.apply(undefined, [
						new ivm.ExternalCopy({
							url: response.url,
							status: response.status,
						}).copyInto(),
						new ivm.Reference(async () => {
							return await response.text()
						}),
						new ivm.Reference(async () => {
							return new ivm.ExternalCopy(await response.json()).copyInto()
						})
					], {
						timeout: 1000
					})
				} catch (err) {
					console.log(err)
					reject.apply(undefined, [
						new ivm.Reference(err)
					], {
						timeout: 1000
					})
				}
			})
		])

	}

}
