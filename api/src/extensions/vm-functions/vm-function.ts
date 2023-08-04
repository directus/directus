import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { Context } from 'isolated-vm'
import type { ApiExtensionInfo } from "../vm.js";

export abstract class VMFunction {
	vmCode: string;

	constructor(url = import.meta.url) {
		const __dirname = fileURLToPath(new URL('.', url));

		this.vmCode = readFileSync(join(__dirname, 'vm.js'), 'utf-8');
	}

	abstract prepareContext(context: Context, extension: ApiExtensionInfo): void;
}
