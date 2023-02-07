export default function getModuleDefault<T extends object>(mod: T | { default: T }): T {
	if ('default' in mod) {
		return mod.default;
	}

	return mod;
}
