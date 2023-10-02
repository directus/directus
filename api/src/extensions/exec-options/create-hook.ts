import { EXEC_CREATE_HOOK } from "@directus/constants";
import { addExecOptions } from "../utils/add-exec-options.js";
import env from '../../env.js';
import logger from "../../logger.js";
import type { ActionHandler, FilterHandler, InitHandler } from "@directus/types";
import { scheduleSynchronizedJob, validateCron } from "../../utils/schedule.js";
import emitter from "../../emitter.js";
import type { EventHandler } from "../../types/events.js";

export default addExecOptions(({ extensionManager, extension }) => {
	const scriptTimeoutMs = Number(env['EXTENSIONS_SECURE_TIMEOUT']);
	let scheduleIndex = 0;

	async function createHook(options: unknown) {

		const validOptions = EXEC_CREATE_HOOK.parse(options);

		if (validOptions.type === 'filter') {
			const { event, callback } = validOptions;

			const handler: FilterHandler = (payload, meta, context) => {
				callback.apply(null, [
					payload,
					meta,
					{ accountability: context.accountability }
				], { timeout: scriptTimeoutMs, arguments: { copy: true } });
			};

			emitter.onFilter(event, handler);

			extensionManager.registration.addUnregisterFunction(extension.name, () => {
				emitter.offFilter(event, handler);
			})
		} else if (validOptions.type === 'action') {
			const { event, callback } = validOptions;

			const handler: ActionHandler = (meta, context) => {
				callback.apply(null, [
					meta,
					{ accountability: context.accountability }
				], { timeout: scriptTimeoutMs, arguments: { copy: true } });
			};

			emitter.onAction(event, handler);

			extensionManager.registration.addUnregisterFunction(extension.name, () => {
				emitter.offAction(event, handler);
			})
		} else if (validOptions.type === 'init') {
			const { event, callback } = validOptions;

			const handler: InitHandler = (meta) => {
				callback.apply(null, [meta], { timeout: scriptTimeoutMs, arguments: { copy: true } });
			};

			emitter.onInit(event, handler);

			extensionManager.registration.addUnregisterFunction(extension.name, () => {
				emitter.offInit(event, handler);
			})
		} else if (validOptions.type === 'schedule') {
			const { cron, callback } = validOptions;

			if (validateCron(cron)) {
				const job = scheduleSynchronizedJob(`${extension.name}:${scheduleIndex}`, cron, async () => {
					if (extensionManager.options.schedule) {
						try {
							callback.apply(null, [], { timeout: scriptTimeoutMs });
						} catch (error: any) {
							logger.error(error);
						}
					}
				});

				scheduleIndex++;

				extensionManager.registration.addUnregisterFunction(extension.name, async () => {
					await job.stop();
				})
			} else {
				logger.warn(`Couldn't register cron hook. Provided cron is invalid: ${cron}`);
			}
		} else if (validOptions.type === 'embed') {
			const { position, code } = validOptions;

			const content = typeof code === 'string' ? code : (await code.apply(null, [], { timeout: scriptTimeoutMs }))?.toString();

			if (!content) return;

			if (content.trim().length === 0) {
				logger.warn(`Couldn't register embed hook. Provided code is empty!`);
				return;
			}

			if (position === 'head') {
				extensionManager.hookEmbedsHead.push(content);

				extensionManager.registration.addUnregisterFunction(extension.name, () => {
					const index = extensionManager.hookEmbedsHead.indexOf(content);
					if (index !== -1) extensionManager.hookEmbedsHead.splice(index, 1);
				})
			}

			if (position === 'body') {
				extensionManager.hookEmbedsBody.push(content);

				extensionManager.registration.addUnregisterFunction(extension.name, () => {
					const index = extensionManager.hookEmbedsBody.indexOf(content);
					if (index !== -1) extensionManager.hookEmbedsBody.splice(index, 1);
				})
			}
		}
	}

	return {
		'create-hook': createHook,
	}
})
