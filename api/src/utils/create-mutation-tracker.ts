import { useEnv } from '@directus/env';
import { InvalidPayloadError } from '@directus/errors';
import type { MutationTracker } from '@directus/types';

/**
 * Create a mutation tracker that enforces the `MAX_BATCH_MUTATION` limit across a batch of writes.
 */
export function createMutationTracker(initialCount = 0): MutationTracker {
	const { MAX_BATCH_MUTATION } = useEnv();
	let mutationCount = initialCount;

	return {
		trackMutations(count: number) {
			mutationCount += count;

			if (mutationCount > MAX_BATCH_MUTATION) {
				throw new InvalidPayloadError({ reason: `Exceeded max batch mutation limit of ${MAX_BATCH_MUTATION}` });
			}
		},
		getCount() {
			return mutationCount;
		},
	};
}
