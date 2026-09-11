import { randomUUID } from 'crypto';
import { sandbox } from '@directus/sandbox';
import { createDirectus, createFlow, createOperation, rest, staticToken, updateFlow } from '@directus/sdk';
import { database } from '@utils/constants.js';
import { getUID } from '@utils/getUID.js';
import { sandboxPort } from '@utils/sandbox-port.js';
import { expect, test } from 'vitest';

/** Seconds the schedule is left running, with a cron that fires once a second. */
const WINDOW = 5;

/**
 * A scheduled flow on two nodes: with a shared synchronization store they take turns so the
 * schedule runs once per tick, without one each node runs it for itself.
 */
const CONFIGS = [
	{ name: 'a shared synchronization store', store: 'redis', expected: WINDOW },
	{ name: 'no shared synchronization store', store: 'memory', expected: WINDOW * 2 },
] as const;

for (const [index, { name, store, expected }] of CONFIGS.entries()) {
	test(`a scheduled flow across two nodes with ${name}`, { timeout: 180_000 }, async () => {
		const scope = randomUUID();

		const directus = await sandbox(database, {
			instances: '2',
			port: sandboxPort(index),
			extras: { redis: true },
			env: {
				SYNCHRONIZATION_STORE: store,
				SYNCHRONIZATION_NAMESPACE: `directus-${database}-${store}`,
				DB_FILENAME: `directus_test_${getUID()}_${store}.db`,
			},
			docker: { suffix: `${getUID()}${store}` },
		});

		const api = createDirectus<unknown>(`http://localhost:${directus.apis[0]!.port}`)
			.with(rest())
			.with(staticToken('admin'));

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

		await new Promise((r) => setTimeout(r, WINDOW * 1000));

		// A single node can only fire once per tick, so twice the ticks means both nodes ran it
		expect(Object.values(msgs).reduce((v, a) => a + v, 0)).toBe(expected);

		await directus.stop();
	});
}
