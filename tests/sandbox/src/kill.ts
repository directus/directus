import { ChildProcess, execSync } from 'child_process';
import { once } from 'events';

/**
 * Windows doesn't properly cleanup child processes, forcing us to do this manually.
 */
export function kill(child: ChildProcess | undefined) {
	if (!child) return;

	if (process.platform === 'win32') {
		try {
			execSync(`taskkill /pid ${child.pid} /T /F`);
		} catch {
			// ignore if the process doesn't exist anymore
		}
	} else {
		child.kill();
	}
}

/** Kill a child process and wait for it to exit, force killing it if it doesn't shut down in time */
export async function killAndWait(child: ChildProcess | undefined, timeout = 5_000) {
	if (!child || child.exitCode !== null || child.signalCode !== null) return;

	const exited = once(child, 'exit');
	const forceKill = setTimeout(() => child.kill('SIGKILL'), timeout);

	kill(child);

	try {
		await exited;
	} finally {
		clearTimeout(forceKill);
	}
}
