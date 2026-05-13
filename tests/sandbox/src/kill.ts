import { ChildProcess, execSync } from 'child_process';

/**
 * Windows doesn't properly cleanup child processes, forcing us to do this manually.
 */
export function kill(child: ChildProcess | undefined) {
	if (!child) return;

	if (process.platform === 'win32') {
		execSync(`taskkill /pid ${child.pid} /T /F`);
	} else {
		child.kill();
	}
}
