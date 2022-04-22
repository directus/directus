export default function getModuleDefault<T>(mod: T | { default: T }): T {
	if ('default' in mod) {
		return mod.default;
	}
	return mod;
}
