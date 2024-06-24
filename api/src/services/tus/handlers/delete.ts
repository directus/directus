import { BaseHandler } from './base.js';
import { ERRORS, EVENTS, type CancellationContext } from '@tus/utils';

import type http from 'node:http';

export class DeleteHandler extends BaseHandler {
	async send(req: http.IncomingMessage, res: http.ServerResponse, context: CancellationContext) {
		const id = this.getFileIdFromRequest(req);

		if (!id) {
			throw ERRORS.FILE_NOT_FOUND;
		}

		if (this.options.onIncomingRequest) {
			await this.options.onIncomingRequest(req, res, id);
		}

		const lock = await this.acquireLock(req, id, context);

		try {
			if (this.options.disableTerminationForFinishedUploads) {
				const upload = await this.store.getUpload(id);

				if (upload.offset === upload.size) {
					throw ERRORS.INVALID_TERMINATION;
				}
			}

			await this.store.remove(id);
		} finally {
			await lock.unlock();
		}

		const writtenRes = this.write(res, 204, {});
		this.emit(EVENTS.POST_TERMINATE, req, writtenRes, id);
		return writtenRes;
	}
}
