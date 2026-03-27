import { createDirectus, createFlow, createOperation, rest, staticToken, triggerFlow, updateFlow } from '@directus/sdk';
import { port } from '@utils/constants.js';
import { useOptions } from '@utils/useOptions.js';
import { expect, test } from 'vitest';

const api = createDirectus<unknown>(`http://localhost:${port}`).with(rest()).with(staticToken('admin'));
const options = useOptions();

const baseOperation = {
	position_x: 19,
	position_y: 1,
	name: 'Get epoch milliseconds',
	key: 'op_exev',
	type: 'exec',
	options: { code: 'module.exports = async function() { return { epoch: Date.now() }; }' },
};

test('trigger webhook', async () => {
	const flow = await api.request(
		createFlow({
			name: 'webhook flow default',
			trigger: 'webhook',
			options: {},
		}),
	);

	const operation = await api.request(
		createOperation({
			flow: flow!.id,
			...baseOperation,
		}),
	);

	await api.request(updateFlow(flow.id, { operation: operation.id }));

	const result1 = (await api.request(triggerFlow('GET', flow.id))) as { epoch: number };
	const result2 = (await api.request(triggerFlow('GET', flow.id))) as { epoch: number };

	expect(result1.epoch).toBeTypeOf('number');
	expect(result2.epoch).toBeTypeOf('number');

	if (options.cache) {
		expect(result2.epoch).toBe(result1.epoch);
	} else {
		expect(result2.epoch).toBeGreaterThan(result1.epoch);
	}
});

test('trigger webhook with cacheEnabled', async () => {
	const flow = await api.request(
		createFlow({
			name: 'webhook flow cache enabled',
			trigger: 'webhook',
			options: { cacheEnabled: true },
		}),
	);

	const operation = await api.request(
		createOperation({
			flow: flow!.id,
			...baseOperation,
		}),
	);

	await api.request(updateFlow(flow.id, { operation: operation.id }));

	const result1 = (await api.request(triggerFlow('GET', flow.id))) as { epoch: number };
	const result2 = (await api.request(triggerFlow('GET', flow.id))) as { epoch: number };

	expect(result1.epoch).toBeTypeOf('number');
	expect(result2.epoch).toBeTypeOf('number');

	if (options.cache) {
		expect(result2.epoch).toBe(result1.epoch);
	} else {
		expect(result2.epoch).toBeGreaterThan(result1.epoch);
	}
});

test('trigger webhook with cacheEnabled set to false', async () => {
	const flow = await api.request(
		createFlow({
			name: 'webhook flow cache enabled',
			trigger: 'webhook',
			options: { cacheEnabled: false },
		}),
	);

	const operation = await api.request(
		createOperation({
			flow: flow!.id,
			...baseOperation,
		}),
	);

	await api.request(updateFlow(flow.id, { operation: operation.id }));

	const result1 = (await api.request(triggerFlow('GET', flow.id))) as { epoch: number };
	const result2 = (await api.request(triggerFlow('GET', flow.id))) as { epoch: number };

	expect(result1.epoch).toBeTypeOf('number');
	expect(result2.epoch).toBeTypeOf('number');

	expect(result2.epoch).toBeGreaterThan(result1.epoch);
});
