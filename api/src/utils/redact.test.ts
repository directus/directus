import { merge } from 'lodash-es';
import { expect, test } from 'vitest';
import { REDACTED_TEXT } from '../constants.js';
import { redact } from './redact.js';

const input = {
	$trigger: {
		event: 'users.create',
		payload: {
			first_name: 'Example',
			last_name: 'User',
			email: 'user@example.com',
			password: 'secret',
		},
		key: 'eb641950-fffa-4388-8606-aede594ae487',
		collection: 'directus_users',
	},
	exec_fm27u: {
		$trigger: {
			event: 'users.create',
			payload: {
				first_name: 'Example',
				last_name: 'User',
				email: 'user@example.com',
				password: 'secret',
			},
			key: 'eb641950-fffa-4388-8606-aede594ae487',
			collection: 'directus_users',
		},
		$last: {
			event: 'users.create',
			payload: {
				first_name: 'Example',
				last_name: 'User',
				email: 'user@example.com',
				password: 'secret',
			},
			key: 'eb641950-fffa-4388-8606-aede594ae487',
			collection: 'directus_users',
		},
	},
};

test('should not mutate input', () => {
	const redactInput = redact(['$trigger'], REDACTED_TEXT);

	expect(redactInput(input)).not.toBe(input);
});

test('should support single level path', () => {
	const redactInput = redact(['$trigger'], REDACTED_TEXT);

	expect(redactInput(input)).toEqual(
		merge({}, input, {
			$trigger: REDACTED_TEXT,
		})
	);
});

test('should support multi level path', () => {
	const redactInput = redact(['$trigger.payload.password'], REDACTED_TEXT);

	expect(redactInput(input)).toEqual(
		merge({}, input, {
			$trigger: {
				payload: { password: REDACTED_TEXT },
			},
		})
	);
});

test('should support wildcard path', () => {
	const redactInput = redact(['*.payload'], REDACTED_TEXT);

	expect(redactInput(input)).toEqual(
		merge({}, input, {
			$trigger: {
				payload: REDACTED_TEXT,
			},
		})
	);
});

test('should support deep path', () => {
	const redactInput = redact(['**.password'], REDACTED_TEXT);

	expect(redactInput(input)).toMatchObject(
		merge({}, input, {
			$trigger: {
				payload: {
					password: REDACTED_TEXT,
				},
			},
			exec_fm27u: {
				$trigger: {
					payload: {
						password: REDACTED_TEXT,
					},
				},
				$last: {
					payload: {
						password: REDACTED_TEXT,
					},
				},
			},
		})
	);
});

test('should support multiple paths', () => {
	const redactInput = redact(['$trigger.key', '*.payload.email', '**.password'], REDACTED_TEXT);

	expect(redactInput(input)).toEqual(
		merge({}, input, {
			$trigger: {
				key: REDACTED_TEXT,
				payload: {
					email: REDACTED_TEXT,
					password: REDACTED_TEXT,
				},
			},
			exec_fm27u: {
				$trigger: {
					payload: {
						password: REDACTED_TEXT,
					},
				},
				$last: {
					payload: {
						password: REDACTED_TEXT,
					},
				},
			},
		})
	);
});
