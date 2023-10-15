import logger from '../../logger.js';

export function handleIsolateError(context: any, error: Error, alwaysRestart = false) {
	logger.error(error);

	if (error.message !== 'Isolate was disposed during execution due to memory limit' && !alwaysRestart) return;

	setTimeout(() => {
		logger.info(`Restarting extension ${context.extension.name}`);
		context.extensionManager.registration.restartExtension(context.extension.name);
	}, 1000);
}
