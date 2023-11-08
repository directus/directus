import { set } from 'lodash-es';
import { TransformStream } from 'node:stream/web';

/**
 * Converts the receiving chunks from the database into a nested structure
 * based on the result from the database.
 */
export const getExpander = (paths: Map<string, string[]>): TransformStream => {
	return new TransformStream({
		transform(chunk, controller) {
			if (chunk?.constructor !== Object) {
				throw new Error(`Error while expanding a result chunk: Can't expand a non-object chunk`);
			}

			const outputChunk = expandChunk(chunk, paths);
			controller.enqueue(outputChunk);
		},
	});
};

/**
 * It takes the chunk from the stream and transforms the
 * flat result from the database (basically a two dimensional matrix)
 * into to proper nested javascript object.
 *
 * @param chunk one row of the database response
 * @param paths the lookup map from the aliases to the nested path
 * @returns an object which reflects the hierarchy from the initial query
 */
export function expandChunk(chunk: Record<string, unknown>, paths: Map<string, string[]>): Record<string, unknown> {
	const result = {};

	for (const [key, value] of Object.entries(chunk)) {
		const path = paths.get(key);

		if (!path) {
			throw new Error(`Error while expanding a result: No path available for dot-notated key ${key}`);
		}

		set(result, path, value);
	}

	return result;
}
