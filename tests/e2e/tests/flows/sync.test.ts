import { sandbox, type Database } from '@directus/sandbox';
import { createDirectus, createFlow, createOperation, rest, staticToken, updateFlow } from '@directus/sdk';
import { randomUUID } from 'crypto';
import getPort from 'get-port';
import { expect, test } from 'vitest';

const database = process.env['DATABASE'] as Database;

test('syncronized flow logging', { timeout: 120_000 }, async () => {
	const scope = randomUUID();

	const directus = await sandbox(database, {
		port: await getPort(),
		instances: '2',
		killPorts: true,
		extras: {
			redis: true,
		},
		env: {
			SYNCHRONIZATION_STORE: 'redis',
			SYNCHRONIZATION_NAMESPACE: `directus-${database}`,
		},
	});

	const api = createDirectus<unknown>(`http://localhost:${directus.env.PORT}`).with(rest()).with(staticToken('admin'));

	const flow = await api.request(
		createFlow({
			name: 'webhook schedule',
			status: 'active',
			trigger: 'schedule',
			options: { cron: '* * * * * *' },
		}),
	);

	const operation = await api.request(
		createOperation({
			position_x: 19,
			position_y: 1,
			name: 'Log to Console',
			key: 'log_to_console',
			type: 'log',
			flow: flow.id,
			options: { message: scope },
		}),
	);

	await api.request(updateFlow(flow.id, { operation: operation.id }));

	const msgs: Record<string, number> = {};

	directus.logger.onLog((msg, group) => {
		if (msg.includes(scope)) {
			msgs[group[0]!] = (msgs[group[0]!] ?? 0) + 1;
		}
	});

	await new Promise((r) => setTimeout(r, 5_000));

	expect(Object.values(msgs).reduce((v, a) => a + v, 0)).toBe(5);
});
