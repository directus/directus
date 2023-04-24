import { afterEach, expect, test, vi } from 'vitest';

const loggerInfo = vi.fn();

vi.doMock('../../logger', () => ({
	default: {
		info: loggerInfo,
	},
}));

const { default: config } = await import('./index.js');

afterEach(() => {
	vi.clearAllMocks();
});

test('logs number message as string', () => {
	const message = 1;

	config.handler({ message }, {} as any);

	expect(loggerInfo).toHaveBeenCalledWith(String(1));
});

test('logs json message as stringified json', () => {
	const message = { test: 'message' };

	config.handler({ message }, {} as any);

	expect(loggerInfo).toHaveBeenCalledWith(JSON.stringify(message));
});
