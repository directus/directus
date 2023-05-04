import { afterEach, beforeAll, expect, test, vi } from 'vitest';

import { validateEnv } from './validate-env.js';
import logger from '../logger.js';

vi.mock('../env', () => ({
	getEnv: vi.fn().mockReturnValue({
		PRESENT_TEST_VARIABLE: true,
	}),
}));

vi.mock('../logger', () => ({
	default: {
		error: vi.fn(),
	},
}));

vi.mock('process', () => ({
	exit: vi.fn(),
}));

beforeAll(() => {
	vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
});

afterEach(() => {
	vi.clearAllMocks();
});

test('should not have any error when key is present', () => {
	validateEnv(['PRESENT_TEST_VARIABLE']);

	expect(logger.error).not.toHaveBeenCalled();
	expect(process.exit).not.toHaveBeenCalled();
});

test('should have error when key is missing', () => {
	validateEnv(['ABSENT_TEST_VARIABLE']);

	expect(logger.error).toHaveBeenCalled();
	expect(process.exit).toHaveBeenCalled();
});
