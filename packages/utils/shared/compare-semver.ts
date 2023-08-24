/**
 * Returns 1 if ver1 is greater than ver2, 0 if they are equal, and -1 if ver1 is less than ver2
 * @param ver1 Fist semver version
 * @param ver2 Second semver version
 */
export function compareSemver(ver1: string | undefined, ver2: string | undefined): number {
	const current = (ver1 || '0.0.0').split('.').map(Number);
	const required = (ver2 || '0.0.0').split('.').map(Number);

	for (let i = 0; i < 3; i++) {
		if (current[i]! > required[i]!) {
			return 1;
		} else if (current[i]! < required[i]!) {
			return -1;
		}
	}

	return 0;
}
