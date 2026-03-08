import { expect, test } from 'vitest';
import { ErrorCode } from '../index.js';
import { InviteInvalidError } from './invite-invalid.js';

test('has correct code and status', () => {
	const error = new InviteInvalidError();

	expect(error.code).toBe(ErrorCode.InviteInvalid);
	expect(error.status).toBe(400);
	expect(error.message).toBe('This invitation is no longer valid.');
});