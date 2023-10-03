import type { ExecContext } from "./add-exec-options.js";

export function handleIsolateError(context: ExecContext, error: Error, alwaysRestart = false) {
	console.error(error);

	if (error.message !== 'Isolate was disposed during execution due to memory limit' && !alwaysRestart) return

	setTimeout(() => {
		console.log('Restarting extension', context.extension.name);
		context.extensionManager.registration.restartSecureExtension(context.extension.name)
	}, 1000)
}
