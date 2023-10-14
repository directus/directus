import type { ActionHandler, FilterHandler } from '@directus/types';
import type { Reference } from 'isolated-vm';
import emitter from '../../emitter.js';
import { addExecOptions } from '../utils/add-exec-options.js';
import { handlerAsReference } from '../utils/handler-as-reference.js';
import { resumeIsolate } from '../utils/resume-isolate.js';
import { EXEC_REGISTER_FILTER_RESPONSE, EXEC_REGISTER_HOOK } from '../validation/register-hook.js';

export default addExecOptions((context) => {
	const { extensionManager, extension } = context;

	// @TODO: Fix extension typecheck
	// if (!isExtensionType(extension, 'hook')) return {};

	// let scheduleIndex = 0;

	async function registerHook(args: unknown[]) {
		handlerAsReference(EXEC_REGISTER_HOOK);

		const [type, validOptions] = EXEC_REGISTER_HOOK.parse(args);

		if (type === 'register-filter') {
			const { event, handler } = validOptions;

			const filterHandler: FilterHandler = async (payload, meta, eventContext) => {
				const result = await resumeIsolate(context, handler as unknown as Reference, [
					payload,
					meta,
					{ accountability: eventContext.accountability },
				]);

				const parsedResult = EXEC_REGISTER_FILTER_RESPONSE.safeParse(result);

				if (!parsedResult.success) {
					return payload;
				}

				return parsedResult.data;
			};

			emitter.onFilter(event, filterHandler);

			extensionManager.registration.addUnregisterFunction(extension.name, () => {
				emitter.offFilter(event, filterHandler);
			});
		} else if (type === 'register-action') {
			const { event, handler } = validOptions;

			const actionHandler: ActionHandler = (meta, eventContext) => {
				resumeIsolate(context, handler as unknown as Reference, [
					meta,
					{ accountability: eventContext.accountability },
				]);
			};

			emitter.onAction(event, actionHandler);

			extensionManager.registration.addUnregisterFunction(extension.name, () => {
				emitter.offAction(event, actionHandler);
			});
		} /* else if (type === 'register-init') {
			const { event, callback } = validOptions;

			const handler: InitHandler = (meta) => {
				callback.apply(null, [meta], { timeout: scriptTimeoutMs, arguments: { copy: true } }).catch(error => {
					extensionManager.registration.restartExtension(extension.name)
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
								extensionManager.registration.restartExtension(extension.name)
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
	};
});
