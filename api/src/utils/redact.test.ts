import { merge } from 'lodash-es';
import { expect, test } from 'vitest';
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
	const redactInput = redact(['$trigger'], '--redacted--');

	expect(redactInput(input)).not.toBe(input);
});

test('should support single level path', () => {
	const redactInput = redact(['$trigger'], '--redacted--');

	expect(redactInput(input)).toEqual(
		merge({}, input, {
			$trigger: '--redacted--',
		})
	);
});

test('should support multi level path', () => {
	const redactInput = redact(['$trigger.payload.password'], '--redacted--');

	expect(redactInput(input)).toEqual(
		merge({}, input, {
			$trigger: {
				payload: { password: '--redacted--' },
			},
		})
	);
});

test('should support wildcard path', () => {
	const redactInput = redact(['*.payload'], '--redacted--');

	expect(redactInput(input)).toEqual(
		merge({}, input, {
			$trigger: {
				payload: '--redacted--',
			},
		})
	);
});

test('should support deep path', () => {
	const redactInput = redact(['**.password'], '--redacted--');

	expect(redactInput(input)).toMatchObject(
		merge({}, input, {
			$trigger: {
				payload: {
					password: '--redacted--',
				},
			},
			exec_fm27u: {
				$trigger: {
					payload: {
						password: '--redacted--',
					},
				},
				$last: {
					payload: {
						password: '--redacted--',
					},
				},
			},
		})
	);
});

test('should support multiple paths', () => {
	const redactInput = redact(['$trigger.key', '*.payload.email', '**.password'], '--redacted--');

	expect(redactInput(input)).toEqual(
		merge({}, input, {
			$trigger: {
				key: '--redacted--',
				payload: {
					email: '--redacted--',
					password: '--redacted--',
				},
			},
			exec_fm27u: {
				$trigger: {
					payload: {
						password: '--redacted--',
					},
				},
				$last: {
					payload: {
						password: '--redacted--',
					},
				},
			},
		})
	);
});
