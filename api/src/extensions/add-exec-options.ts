import type { ExtensionManager } from "./extensions.js";
import type { ApiExtensionInfo } from "./vm.js";

export type ExecFunction = (options: unknown) => Promise<any>;
export type ExecOptions = Record<string, ExecFunction>;
export type ExecContext = {
	extensionManager: ExtensionManager,
	extension: ApiExtensionInfo,
}

export function addExecOptions(callback: (context: ExecContext) => ExecOptions) {
	return callback;
}
