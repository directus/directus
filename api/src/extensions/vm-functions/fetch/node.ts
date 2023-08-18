import type { Context } from "isolated-vm";
import type { ApiExtensionInfo } from "../../vm.js";
import { VMFunction } from "../vm-function.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')

export class FetchVMFunction extends VMFunction {


	override prepareContext(context: Context, extension: ApiExtensionInfo): void {
		const permissions = extension.granted_permissions

		context.evalClosure(this.readV8Code(import.meta.url), [
			ivm,
			new ivm.Reference(async function (url: string, options: any, resolve: any, reject: any) {
				if (permissions.find(permission => permission.permission === "fetch") === undefined) {
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
							bodyUsed: response.bodyUsed,
							headers: new ivm.ExternalCopy(response.headers).copyInto(),
							ok: response.ok,
							redirected: response.redirected,
							status: response.status,
							statusText: response.statusText,
							type: response.type,
						}).copyInto(),
						new ivm.Reference(async () => {
							return await response.text()
						}),
						new ivm.Reference(async () => {
							return new ivm.ExternalCopy(await response.json()).copyInto()
						}),
						new ivm.Reference(async () => {
							return new ivm.ExternalCopy(await response.blob()).copyInto()
						}),
						new ivm.Reference(async () => {
							return new ivm.ExternalCopy(await response.arrayBuffer()).copyInto()
						}),
						new ivm.Reference(async () => {
							return new ivm.ExternalCopy(await response.formData()).copyInto()
						}),
					], {
						timeout: 1000
					})
				} catch (err) {
					console.log(err)
					reject.apply(undefined, [
						new ivm.ExternalCopy(err).copyInto()
					], {
						timeout: 1000
					})
				}
			})
		])

	}

}
