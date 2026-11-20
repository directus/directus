import type { Readable, Writable } from 'node:stream';

/**
 * Destroy the targetStream that is being piped into without destroying the sourceStream.
 * (╯°□°）╯︵ ┻━┻
 */
export function destroyPipedStream(targetStream: Writable, sourceStream: Readable) {
	sourceStream.unpipe(targetStream);
	targetStream.destroy();
	sourceStream.resume();
}
