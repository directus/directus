import type { Response } from 'express';

/**
 * Releases whatever is being piped into the response when the client disconnects before the
 * response was fully written
 *
 * @param res Express response object
 * @param destroy Releases the source, run immediately when the response is already gone
 * @returns True if the response was already gone, so the caller can skip piping into it.
 */
export function destroyOnDisconnect(res: Response, destroy: () => void): boolean {
	if (res.closed || res.destroyed) {
		destroy();
		return true;
	}

	res.on('close', () => {
		if (!res.writableEnded) destroy();
	});

	return false;
}
