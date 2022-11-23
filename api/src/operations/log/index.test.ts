import { afterEach, beforeAll, describe, expect, SpyInstance, test, vi } from 'vitest';

import logger from '../../logger';
import config from './index';

vi.mock('../../logger', () => ({
	default: {
		info: vi.fn(),
	},
}));

describe('Operations / Log', () => {
	let loggerInfoSpy: SpyInstance;

	beforeAll(() => {
		loggerInfoSpy = vi.spyOn(logger, 'info');
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	test('logs number message as string', () => {
		const message = 1;

		config.handler({ message }, {} as any);

		expect(loggerInfoSpy).toHaveBeenCalledWith(String(1));
	});

	test('logs json message as stringified json', () => {
		const message = { test: 'message' };

		config.handler({ message }, {} as any);

		expect(loggerInfoSpy).toHaveBeenCalledWith(JSON.stringify(message));
	});
});
