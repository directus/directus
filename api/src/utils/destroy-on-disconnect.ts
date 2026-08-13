import type { Response } from 'express';

/**
 * Runs `destroy` once the client disconnects before the response was fully written, releasing
 * whatever was being piped into it. Runs it immediately when the response is already gone, in which
 * case `true` is returned so the caller can stop instead of piping into a dead response.
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
