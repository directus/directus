import { EXEC_REGISTER_HOOK } from "@directus/constants";
import { addExecOptions } from "../utils/add-exec-options.js";
import type { ActionHandler, FilterHandler } from "@directus/types";
import emitter from "../../emitter.js";
import { resumeIsolate } from "../utils/resume-isolate.js";

export default addExecOptions((context) => {
	const { extensionManager, extension } = context

	// let scheduleIndex = 0;

	async function registerHook(args: unknown[]) {

		const [type, validOptions] = EXEC_REGISTER_HOOK.parse(args);

		if (type === 'register-filter') {
			const { event, callback } = validOptions;

			const handler: FilterHandler = (payload, meta, eventContext) => {
				resumeIsolate(context, callback, [
					payload,
					meta,
					{ accountability: eventContext.accountability }
				])
			};

			emitter.onFilter(event, handler);

			extensionManager.registration.addUnregisterFunction(extension.name, () => {
				emitter.offFilter(event, handler);
			})
		} else if (type === 'register-action') {
			const { event, callback } = validOptions;

			const handler: ActionHandler = (meta, eventContext) => {
				resumeIsolate(context, callback, [
					meta,
					{ accountability: eventContext.accountability }
				])
			};

			emitter.onAction(event, handler);

			extensionManager.registration.addUnregisterFunction(extension.name, () => {
				emitter.offAction(event, handler);
			})
		} /* else if (type === 'register-init') {
			const { event, callback } = validOptions;

			const handler: InitHandler = (meta) => {
				callback.apply(null, [meta], { timeout: scriptTimeoutMs, arguments: { copy: true } }).catch(error => {
					extensionManager.registration.restartSecureExtension(extension.name)
				})
			};

			emitter.onInit(event, handler);

			extensionManager.registration.addUnregisterFunction(extension.name, () => {
				emitter.offInit(event, handler);
			})
		} else if (type === 'register-schedule') {
			const { cron, callback } = validOptions;

			if (validateCron(cron)) {
				const job = scheduleSynchronizedJob(`${extension.name}:${scheduleIndex}`, cron, async () => {
					if (extensionManager.options.schedule) {
						try {
							callback.apply(null, [], { timeout: scriptTimeoutMs }).catch(error => {
								extensionManager.registration.restartSecureExtension(extension.name)
							})
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
		} else if (type === 'register-embed') {
			const { position, code } = validOptions;

			if (!code) return;

			if (code.trim().length === 0) {
				logger.warn(`Couldn't register embed hook. Provided code is empty!`);
				return;
			}

			if (position === 'head') {
				extensionManager.hookEmbedsHead.push(code);

				extensionManager.registration.addUnregisterFunction(extension.name, () => {
					const index = extensionManager.hookEmbedsHead.indexOf(code);
					if (index !== -1) extensionManager.hookEmbedsHead.splice(index, 1);
				})
			}

			if (position === 'body') {
				extensionManager.hookEmbedsBody.push(code);

				extensionManager.registration.addUnregisterFunction(extension.name, () => {
					const index = extensionManager.hookEmbedsBody.indexOf(code);
					if (index !== -1) extensionManager.hookEmbedsBody.splice(index, 1);
				})
			}
		} */
	}

	return {
		'register-action': registerHook,
		'register-filter': registerHook,
	}
})
