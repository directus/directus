import type { ApiExtensionInfo } from "../vm.js";

export function isExtensionType(extension: ApiExtensionInfo, type: string) {
	return extension.type === type || extension.type === 'bundle' && extension.entries[0]!.type === type;
}
