import type { Context, Reference } from 'isolated-vm';
import type { ApiExtensionInfo } from '../../vm.js';
import { VMFunction } from '../vm-function.js';
import express from 'express';
import { createRequire } from 'node:module';
import type { ExtensionManager } from '../../extensions.js';

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm');

export class DefineEndpointVMFunction extends VMFunction {
	private extensionManager: ExtensionManager;

	constructor(extensionManager: ExtensionManager) {
		super();
		this.extensionManager = extensionManager;
	}

	override prepareContext(context: Context, extension: ApiExtensionInfo): void {
		const endpointRouter = this.extensionManager.registration.endpointRouter;

		const scopedRouter = express.Router();
		endpointRouter.use(`/${extension.name}`, scopedRouter);

		context.evalClosureSync(this.readV8Code(import.meta.url), [
			ivm,
			new ivm.Reference(function (
				type: 'all' | 'get' | 'post' | 'patch' | 'delete' | 'options',
				path: string,
				callback: any
			) {
				scopedRouter[type](path, (req, res) => {
					callback.apply(
						undefined,
						[
							new ivm.ExternalCopy({
								baseUrl: req.baseUrl,
								body: req.body,
								fresh: req.fresh,
								hostname: req.hostname,
								ip: req.ip,
								ips: req.ips,
								method: req.method,
								originalUrl: req.originalUrl,
								params: req.params,
								path: req.path,
								protocol: req.protocol,
								query: req.query,
								secure: req.secure,
								stale: req.stale,
								subdomains: req.subdomains,
								url: req.url,
								xhr: req.xhr,
								accepts: new ivm.Callback((...args: any) => {
									return req.accepts(...args);
								}),
								acceptsCharsets: new ivm.Callback((...args: any) => {
									return req.acceptsCharsets(...args);
								}),
								acceptsEncodings: new ivm.Callback((...args: any) => {
									return req.acceptsEncodings(...args);
								}),
								acceptsLanguages: new ivm.Callback((...args: any) => {
									return req.acceptsLanguages(...args);
								}),
								get: new ivm.Callback((name: string) => {
									return req.get(name);
								}),
								is: new ivm.Callback((name: string) => {
									return req.is(name);
								}),
							}).copyInto(),
							new ivm.ExternalCopy({
								headersSent: res.headersSent,
								append: new ivm.Callback((field: string, value?: string | string[] | undefined) => {
									res.append(field, value);
								}),
								attachment: new ivm.Callback((filename?: string | undefined) => {
									res.attachment(filename);
								}),
								end: new ivm.Callback((chunk: any, cb?: Reference) => {
									res.end(chunk, () => {
										cb?.apply(undefined, []);
									});
								}),
								get: new ivm.Callback((field: string) => {
									return res.get(field);
								}),
								json: new ivm.Callback((body?: any) => {
									res.json(body);
								}),
								links: new ivm.Callback((links: any) => {
									return res.links(links);
								}),
								location: new ivm.Callback((response: string) => {
									res.location(response);
								}),
								redirect: new ivm.Callback((...args: any) => {
									res.redirect(args[0], args[1]);
								}),
								send: new ivm.Callback((body: any) => {
									res.send(body);
								}),
								sendStatus: new ivm.Callback((code: number) => {
									res.sendStatus(code);
								}),
								set: new ivm.Callback((...args: any) => {
									res.set(args[0], args[1]);
								}),
								status: new ivm.Callback((code: number) => {
									res.status(code);
								}),
								type: new ivm.Callback((type: string) => {
									res.type(type);
								}),
								vary: new ivm.Callback((field: string) => {
									res.vary(field);
								}),
							}).copyInto(),
						],
						{
							timeout: 1000,
						}
					);
				});
			}),
		]);
	}
}
