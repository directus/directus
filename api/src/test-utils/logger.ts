import { vi } from 'vitest';

/**
 * Logger with every level stubbed, so code that logs at a level a test didn't anticipate
 * doesn't fail with "is not a function". `child` hands back the same logger, so calls made
 * through a child can be asserted on the parent.
 */
export function createMockLogger() {
	const logger = {
		fatal: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
		child: vi.fn(),
	};

	logger.child.mockReturnValue(logger);

	return logger;
}
