import { InstallationManager } from './manager.js';

let manager: InstallationManager | undefined;

export function getInstallationManager(): InstallationManager {
	if (manager) {
		return manager;
	}

	manager = new InstallationManager();

	return manager;
}
