import { promisify } from 'node:util';
import { gzip as gzipCallback } from 'node:zlib';

const gzip = promisify(gzipCallback);

export const compress = async (buf: Uint8Array) => {
	return await gzip(buf, {
		/** Todo reduce level to improve speed */
	});
}
