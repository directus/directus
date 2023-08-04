import type { Context } from "isolated-vm";
import type { ApiExtensionInfo } from "../../vm.js";
import { VMFunction } from "../vm-function.js";
import express from 'express';
import { createRequire } from "node:module";
import type { ExtensionManager } from "../../extensions.js";

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')


export class DefineEndpointVMFunction extends VMFunction {
	private extensionManager: ExtensionManager

	constructor(extensionManager: ExtensionManager) {
		super(import.meta.url)
		this.extensionManager = extensionManager
	}

	override prepareContext(context: Context, extension: ApiExtensionInfo): void {

		const endpointRouter = this.extensionManager.registration.endpointRouter

		const scopedRouter = express.Router();
		endpointRouter.use(`/${extension.name}`, scopedRouter);

		context.evalClosureSync(this.vmCode, [
			ivm,
			new ivm.Reference(function (type: 'get' | 'post' | 'patch', path: string, callback: any) {
				console.log("Endpoint: ", type, path)
				scopedRouter[type](path, (req, res) => {
					callback.apply(undefined, [
						new ivm.ExternalCopy({
							params: req.params,
							url: req.url
						}).copyInto(),
						new ivm.ExternalCopy({
							send: new ivm.Callback((response: string) => {
								res.send(response)
							})
						}).copyInto()
					], {
						timeout: 1000
					}).catch((err: any) => {
						console.error(err)
					})
				})

			})
		])

	}

}
