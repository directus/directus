import { set } from 'lodash-es';
import { TransformStream } from 'node:stream/web';

/**
 * Convert and expand input objects to a nested structure based on the given paths map
 */
export const expand = (paths: Map<string, string[]>) => {
	return new TransformStream({
		transform(chunk, controller) {
			if (chunk?.constructor !== Object) {
				throw new Error(`Can't expand a non-object chunk`);
			}

			const outputChunk = transformChunk(chunk, paths);
			controller.enqueue(outputChunk);
		},
	});
};

/**
 * It takes the chunk from the stream and transforms the flat object from the database to a nested object.
 *
 * @param chunk
 * @param paths
 * @returns
 */
export function transformChunk(chunk: any, paths: Map<string, string[]>) {
	const outputChunk = {};

	for (const [key, value] of Object.entries(chunk)) {
		const path = paths.get(key);

		if (!path) {
			throw new Error(`No path available for dot-notated key ${key}`);
		}

		set(outputChunk, path, value);
	}

	return outputChunk;
}
