import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ivm = require('isolated-vm')

export function createVMError(error: Error) {
	return new ivm.ExternalCopy(error).copyInto()
}
