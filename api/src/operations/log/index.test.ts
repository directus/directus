import type { Logger } from 'pino';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { useLogger } from '../../logger.js';
import config from './index.js';

vi.mock('../../logger.js');

let mockLogger: Logger<never>;

beforeEach(() => {
	mockLogger = {
		info: vi.fn(),
	} as unknown as Logger<never>;

	vi.mocked(useLogger).mockReturnValue(mockLogger);
});

afterEach(() => {
	vi.clearAllMocks();
});

test('logs number message as string', () => {
	const message = 1;

	config.handler({ message }, {} as any);

	expect(mockLogger.info).toHaveBeenCalledWith(String(1));
});

test('logs json message as stringified json', () => {
	const message = { test: 'message' };

	config.handler({ message }, {} as any);

	expect(mockLogger.info).toHaveBeenCalledWith(JSON.stringify(message));
});
