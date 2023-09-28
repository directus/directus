import { set } from 'lodash-es';
import { TransformStream } from 'node:stream/web';

/**
 * Converts the receiving chunks from the database into a nested structure
 * based on the result from the database.
 */
export const getOrmTransformer = (paths: Map<string, string[]>): TransformStream => {
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
 * It takes the chunk from the stream and transforms the
 * flat result from the database (basically a two dimensional matrix)
 * into to proper nested javascript object.
 *
 * @param chunk one row of the database response
 * @param paths the lookup map from the aliases to the nested path
 * @returns an object which reflects the hierarchy from the initial query
 */
export function transformChunk(chunk: Record<string, any>, paths: Map<string, string[]>): Record<string, any> {
	const result = {};

	for (const [key, value] of Object.entries(chunk)) {
		const path = paths.get(key);

		if (!path) {
			throw new Error(`No path available for dot-notated key ${key}`);
		}

		set(result, path, value);
	}

	return result;
}
