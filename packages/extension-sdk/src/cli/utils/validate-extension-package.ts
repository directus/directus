export default function validateExtensionPackage(options: Record<string, any>): boolean {
	if (
		options.type === undefined ||
		options.path === undefined ||
		options.source === undefined ||
		options.host === undefined ||
		options.hidden === undefined
	) {
		return false;
	}

	return true;
}
