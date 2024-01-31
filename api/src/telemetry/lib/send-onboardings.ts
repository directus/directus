import PQueue from 'p-queue';
import { collectOnboarding } from '../../utils/onboarding.js';

/**
 * Post onboarding answers to the centralized intake server
 */
export const resendOnboardings = async (userIds: string[]) => {
	const queue = new PQueue({ concurrency: 2, interval: 500 });

	for (const id of userIds) {
		queue.add(() => collectOnboarding(id));
	}

	await queue.onIdle();
};
