import os from 'os';

/**
 * Get current host OS information
 *
 * @returns Object of OS type and version
 */
export function getOSInfo() {
	const osType = os.type() === 'Darwin' ? 'macOS' : os.type();

	const osVersion = osType === 'macOS' ? macosRelease() : os.release();

	return { osType, osVersion };
}

/**
 * Get the name and version of a macOS release from the Darwin version.
 * Lifted from `macos-release`.
 */
function macosRelease() {
	const release = Number(os.release().split('.')[0]);

	const nameMap = new Map<number, [name: string, version: string]>([
		[22, ['Ventura', '13']],
		[21, ['Monterey', '12']],
		[20, ['Big Sur', '11']],
		[19, ['Catalina', '10.15']],
		[18, ['Mojave', '10.14']],
		[17, ['High Sierra', '10.13']],
		[16, ['Sierra', '10.12']],
		[15, ['El Capitan', '10.11']],
		[14, ['Yosemite', '10.10']],
		[13, ['Mavericks', '10.9']],
		[12, ['Mountain Lion', '10.8']],
		[11, ['Lion', '10.7']],
		[10, ['Snow Leopard', '10.6']],
		[9, ['Leopard', '10.5']],
		[8, ['Tiger', '10.4']],
		[7, ['Panther', '10.3']],
		[6, ['Jaguar', '10.2']],
		[5, ['Puma', '10.1']],
	]);

	const current = nameMap.get(release);

	return current ? `${current[0]} (${current[1]})` : 'Unknown';
}
