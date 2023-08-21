import type { Context, Reference } from "isolated-vm";
import type { ApiExtensionInfo } from "../../vm.js";
import { VMFunction } from "../vm-function.js";
import emitter from '../../../emitter.js';
import { createRequire } from "module";
import type { EventHandler } from "../../../types/events.js";
import type { ActionHandler, FilterHandler, InitHandler } from "@directus/types";
import type { ExtensionManager } from "../../extensions.js";
import { scheduleSynchronizedJob, validateCron } from "../../../utils/schedule.js";
import logger from "../../../logger.js";

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')

type HookType = 'filter' | 'action' | 'init' | 'schedule' | 'embed'
export class DefineHookVMFunction extends VMFunction {
	private extensionManager: ExtensionManager

	constructor(extensionManager: ExtensionManager) {
		super()
		this.extensionManager = extensionManager
	}

	override async prepareContext(context: Context, extension: ApiExtensionInfo): Promise<EventHandler[]> {

		const hookEvents: EventHandler[] = []
		let scheduleIndex = 0;

		await context.evalClosure(this.readV8Code(import.meta.url), [
			ivm,
			new ivm.Reference(async (type: HookType, ...args: any) => {
				if (type === 'filter') {
					const [event, callback]: [string, Reference] = args

					const handler: FilterHandler = (payload, meta, _filterContext) => {
						callback.apply(null, [
							new ivm.ExternalCopy(payload).copyInto(),
							new ivm.ExternalCopy(meta).copyInto(),
						])
					}

					emitter.onFilter(event, handler);

					hookEvents.push({ type: 'filter', name: event, handler })

				} else if (type === 'action') {
					const [event, callback]: [string, Reference] = args

					const handler: ActionHandler = (meta, _filterContext) => {
						callback.apply(null, [
							new ivm.ExternalCopy(meta).copyInto(),
						])
					}

					hookEvents.push({ type: 'action', name: event, handler })

					emitter.onAction(event, handler);
				} else if (type === 'init') {
					const [event, callback]: [string, Reference] = args

					const handler: InitHandler = (meta) => {
						callback.apply(null, [
							new ivm.ExternalCopy(meta).copyInto(),
						])
					}

					hookEvents.push({ type: 'init', name: event, handler })

					emitter.onAction(event, handler);
				} else if (type === 'schedule') {
					const [cron, callback]: [string, Reference] = args

					if (validateCron(cron)) {
						const job = scheduleSynchronizedJob(`${extension.name}:${scheduleIndex}`, cron, async () => {
							if (this.extensionManager.options.schedule) {
								try {
									callback.apply(null, [])
								} catch (error: any) {
									logger.error(error);
								}
							}
						});

						scheduleIndex++;

						hookEvents.push({
							type: 'schedule',
							job,
						});
					} else {
						logger.warn(`Couldn't register cron hook. Provided cron is invalid: ${cron}`);
					}
				} else if (type === 'embed') {
					const [position, code]: ['head' | 'body', string | Reference] = args

					const content = typeof code === 'string' ? code : (await code.apply(null, []))?.toString();

					if (!content) return

					if (content.trim().length === 0) {
						logger.warn(`Couldn't register embed hook. Provided code is empty!`);
						return;
					}

					if (position === 'head') {
						this.extensionManager.hookEmbedsHead.push(content);
					}

					if (position === 'body') {
						this.extensionManager.hookEmbedsBody.push(content);
					}
				}
			})
		])

		return hookEvents
	}

}
