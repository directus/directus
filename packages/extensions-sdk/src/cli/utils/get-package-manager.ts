import getPackageManagerAgent from './get-package-manager-agent.js';

/**
 * Determine whether to use pnpm, yarn, or npm based on the parsed package manager agent info
 */
export default function getPackageManager(): string {
	const agent = getPackageManagerAgent();

	if (agent !== null) {
		if ('pnpm' in agent && agent['pnpm'] !== '?') return 'pnpm';
		if ('yarn' in agent && agent['yarn'] !== '?') return 'yarn';
	}

	return 'npm';
}
