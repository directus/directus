import { EXEC_CREATE_HOOK } from "@directus/constants";
import { addExecOptions } from "../add-exec-options.js";
import env from '../../env.js';
import logger from "../../logger.js";
import type { ActionHandler, FilterHandler, InitHandler } from "@directus/types";
import { scheduleSynchronizedJob, validateCron } from "../../utils/schedule.js";
import emitter from "../../emitter.js";
import type { EventHandler } from "../../types/events.js";

export default addExecOptions(({ extensionManager, extension }) => {
	const scriptTimeoutMs = Number(env['EXTENSIONS_SECURE_TIMEOUT']);
	let scheduleIndex = 0;

	// TODO: We somehow have to pass this up
	const hookEvents: EventHandler[] = [];

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

			hookEvents.push({ type: 'filter', name: event, handler });
		} else if (validOptions.type === 'action') {
			const { event, callback } = validOptions;

			const handler: ActionHandler = (meta, context) => {
				callback.apply(null, [
					meta,
					{ accountability: context.accountability }
				], { timeout: scriptTimeoutMs, arguments: { copy: true } });
			};

			emitter.onAction(event, handler);

			hookEvents.push({ type: 'action', name: event, handler });
		} else if (validOptions.type === 'init') {
			const { event, callback } = validOptions;

			const handler: InitHandler = (meta) => {
				callback.apply(null, [meta], { timeout: scriptTimeoutMs, arguments: { copy: true } });
			};

			hookEvents.push({ type: 'init', name: event, handler });

			emitter.onAction(event, handler);
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

				hookEvents.push({
					type: 'schedule',
					job,
				});
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
			}

			if (position === 'body') {
				extensionManager.hookEmbedsBody.push(content);
			}
		}
	}

	return {
		'create-hook': createHook,
	}
})
