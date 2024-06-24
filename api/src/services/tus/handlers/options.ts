import { BaseHandler } from './base.js';
import { ALLOWED_METHODS, MAX_AGE, HEADERS } from '@tus/utils';

import type http from 'node:http';

// A successful response indicated by the 204 No Content status MUST contain
// the Tus-Version header. It MAY include the Tus-Extension and Tus-Max-Size headers.
export class OptionsHandler extends BaseHandler {
	async send(req: http.IncomingMessage, res: http.ServerResponse) {
		const maxSize = await this.getConfiguredMaxSize(req, null);

		if (maxSize) {
			res.setHeader('Tus-Max-Size', maxSize);
		}

		const allowedHeaders = [...HEADERS, ...(this.options.allowedHeaders ?? [])];

		res.setHeader('Access-Control-Allow-Methods', ALLOWED_METHODS);
		res.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
		res.setHeader('Access-Control-Max-Age', MAX_AGE);

		if (this.store.extensions.length > 0) {
			res.setHeader('Tus-Extension', this.store.extensions.join(','));
		}

		return this.write(res, 204);
	}
}
