import { expect } from 'vitest';
import { CliError } from '../kernel/error.js';

export function expectCliError(fn: () => unknown): CliError {
	try {
		fn();
	} catch (error) {
		expect(error).toBeInstanceOf(CliError);
		return error as CliError;
	}

	throw new Error('expected a CliError');
}
