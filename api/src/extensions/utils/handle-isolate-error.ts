import logger from "../../logger.js";
import type { ExecContext } from "./add-exec-options.js";

export function handleIsolateError(context: ExecContext, error: Error, alwaysRestart = false) {
	logger.error(error);

	if (error.message !== 'Isolate was disposed during execution due to memory limit' && !alwaysRestart) return

	setTimeout(() => {
		logger.info(`Restarting extension ${context.extension.name}`);
		context.extensionManager.registration.restartExtension(context.extension.name)
	}, 1000)
}
