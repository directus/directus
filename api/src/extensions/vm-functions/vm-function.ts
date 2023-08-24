import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { Context } from 'isolated-vm';
import type { ApiExtensionInfo } from '../vm.js';

export abstract class VMFunction {
	protected readV8Code(url: string) {
		const __dirname = fileURLToPath(new URL('.', url));

		return readFileSync(join(__dirname, 'vm.js'), 'utf-8');
	}

	abstract prepareContext(context: Context, extension: ApiExtensionInfo): void;
}
