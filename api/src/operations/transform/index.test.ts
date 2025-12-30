import config from './index.js';
import { expect, test } from 'vitest';


test('runs the same object as the input', async () => {
	const json = { test: 'item' };

	const result = await config.handler({ json }, {} as any);

	expect(result).toEqual(json);
});

test('runs parsed JSON for stringified JSON input', async () => {
	const json = '{"test":"item"}';

	const result = await config.handler({ json }, {} as any);

	expect(result).toEqual({ test: 'item' });
});
