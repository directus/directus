import type { Context } from "isolated-vm";
import type { ApiExtensionInfo } from "../../vm.js";
import { VMFunction } from "../vm-function.js";
import emitter from '../../../emitter.js';
import { createRequire } from "module";
import type { EventHandler } from "../../../types/events.js";
import type { ActionHandler, FilterHandler } from "@directus/types";

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')

export class DefineHookVMFunction extends VMFunction {

	override async prepareContext(context: Context, extension: ApiExtensionInfo): Promise<EventHandler[]> {

		const hookEvents: EventHandler[] = []

		await context.evalClosure(this.readV8Code(import.meta.url), [
			ivm,
			new ivm.Reference(async function (type: 'filter' | 'action', event: string, callback: any) {
				if (type === 'filter') {
					const handler: FilterHandler = (payload, meta, filterContext) => {
						console.log('filter', event, payload, meta)
						callback.apply(null, [
							new ivm.ExternalCopy(payload).copyInto(),
							new ivm.ExternalCopy(meta).copyInto(),
						])
					}

					emitter.onFilter(event, handler);

					hookEvents.push({ type: 'filter', name: event, handler })

				} else if (type === 'action') {
					const handler: ActionHandler = (meta, filterContext) => {
						console.log('action', event, meta)
						callback.apply(null, [
							new ivm.ExternalCopy(meta).copyInto(),
						])
					}

					hookEvents.push({ type: 'action', name: event, handler })

					emitter.onAction(event, handler);
				}
			})
		])

		return hookEvents
	}

}
