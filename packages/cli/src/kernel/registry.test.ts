import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { defineCommand, definePlugin } from './plugins/define.js';
import { createRegistry } from './registry.js';

const ping = defineCommand({
	name: 'ping',
	description: 'Ping the instance',
	args: z.object({}),
	run() {},
});

const plugin = definePlugin({
	name: 'demo',
	description: 'Demo plugin',
	commands: {
		ping: { summary: 'Ping the instance', load: async () => ping },
	},
});

describe('createRegistry', () => {
	it('resolves a registered command', () => {
		const result = createRegistry([plugin]);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value.resolve('demo', 'ping')).toBeDefined();
	});

	it('returns undefined for an unknown command', () => {
		const result = createRegistry([plugin]);
		if (result.ok) expect(result.value.resolve('demo', 'nope')).toBeUndefined();
	});

	it('lists command paths for did-you-mean suggestions', () => {
		const result = createRegistry([plugin]);
		if (result.ok) expect(result.value.commandPaths()).toEqual(['demo ping']);
	});

	it('rejects duplicate plugin names', () => {
		const result = createRegistry([plugin, plugin]);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.error.code).toBe('CONFIG');
	});
});
