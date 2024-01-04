import { useEnv } from '@directus/env';
import type { Logger } from 'pino';
import { afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import { useLogger } from '../logger.js';
import { validateEnv } from './validate-env.js';

vi.mock('@directus/env');

vi.mock('../logger');

vi.mock('process', () => ({
	cwd: vi.fn(),
	exit: vi.fn(),
}));

let mockLogger: Logger<never>;

beforeAll(() => {
	vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

	vi.mocked(useEnv).mockReturnValue({
		PRESENT_TEST_VARIABLE: 'true',
	});
});

beforeEach(() => {
	mockLogger = {
		error: vi.fn(),
	} as unknown as Logger<never>;

	vi.mocked(useLogger).mockReturnValue(mockLogger);
});

afterEach(() => {
	vi.clearAllMocks();
});

test('should not have any error when key is present', () => {
	validateEnv(['PRESENT_TEST_VARIABLE']);

	expect(mockLogger.error).not.toHaveBeenCalled();
	expect(process.exit).not.toHaveBeenCalled();
});

test('should have error when key is missing', () => {
	validateEnv(['ABSENT_TEST_VARIABLE']);

	expect(mockLogger.error).toHaveBeenCalled();
	expect(process.exit).toHaveBeenCalled();
});
