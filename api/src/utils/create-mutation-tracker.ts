import { useEnv } from '@directus/env';
import { InvalidPayloadError } from '@directus/errors';
import type { MutationTracker } from '@directus/types';

/**
 * Create a mutation tracker that enforces the `MAX_BATCH_MUTATION` limit across a batch of writes.
 */
export function createMutationTracker(initialCount = 0): MutationTracker {
	const env = useEnv();
	const maxCount = Number(env['MAX_BATCH_MUTATION']);
	let mutationCount = initialCount;

	return {
		trackMutations(count: number) {
			mutationCount += count;

			if (mutationCount > maxCount) {
				throw new InvalidPayloadError({ reason: `Exceeded max batch mutation limit of ${maxCount}` });
			}
		},
		getCount() {
			return mutationCount;
		},
	};
}
