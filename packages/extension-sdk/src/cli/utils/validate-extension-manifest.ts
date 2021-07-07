export default function validateExtensionPackage(extension: Record<string, any>): boolean {
	if (
		extension.type === undefined ||
		extension.path === undefined ||
		extension.source === undefined ||
		extension.host === undefined ||
		extension.hidden === undefined
	) {
		return false;
	}

	return true;
}
