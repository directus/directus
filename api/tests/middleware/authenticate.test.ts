// @ts-nocheck

import '../../src/types/express.d.ts';
import { handler } from '../../src/middleware/authenticate';
import emitter from '../../src/emitter';

jest.mock('../../src/emitter');

afterEach(() => {
	jest.resetAllMocks();
});

test('Short-circuits when authenticate filter is used', async () => {
	const req = {
		ip: '127.0.0.1',
		get: jest.fn(),
	};

	const res = {};
	const next = jest.fn();

	const customAccountability = { admin: true };

	const mockEmitter = jest.mocked(emitter, true);
	mockEmitter.emitFilter.mockResolvedValue(customAccountability);

	await handler(req, res, next);

	expect(req.accountability).toEqual(customAccountability);
	expect(next).toHaveBeenCalledTimes(1);
});

test('Uses default public accountability when no token is given', async () => {
	const req = {
		ip: '127.0.0.1',
		get: jest.fn((string) => (string === 'user-agent' ? 'fake-user-agent' : null)),
	};

	const res = {};
	const next = jest.fn();

	const mockEmitter = jest.mocked(emitter, true);
	mockEmitter.emitFilter.mockImplementation((_, payload) => payload);

	await handler(req, res, next);

	expect(req.accountability).toEqual({
		user: null,
		role: null,
		admin: false,
		app: false,
		ip: '127.0.0.1',
		userAgent: 'fake-user-agent',
	});
	expect(next).toHaveBeenCalledTimes(1);
});
