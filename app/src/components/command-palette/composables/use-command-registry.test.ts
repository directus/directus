import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { RouteLocationNormalizedLoaded } from 'vue-router';

describe('useCommandRegistry', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	test('sorts commands after matching commands', async () => {
		const { registerCommands, useRegisteredCommands } = await import('./use-command-registry');
		const { flushPromises } = await import('@vue/test-utils');
		const { ref } = await import('vue');

		registerCommands({
			commands: [
				{
					id: 'copy',
					name: 'Copy',
					icon: 'content_copy',
					after: 'open',
					action: vi.fn(),
				},
				{
					id: 'open',
					name: 'Open',
					icon: 'open_in_new',
					action: vi.fn(),
				},
			],
		});

		const { commands } = useRegisteredCommands(ref({ route: {} as RouteLocationNormalizedLoaded, search: '' }));

		await flushPromises();

		expect(commands.value.map(({ id }) => id)).toEqual(['open', 'copy']);
	});

	test('sorts groups after matching groups', async () => {
		const { registerCommands, useRegisteredCommands } = await import('./use-command-registry');
		const { flushPromises } = await import('@vue/test-utils');
		const { ref } = await import('vue');

		registerCommands({
			groups: [
				{
					id: 'settings',
					name: 'Settings',
					after: 'content',
				},
				{
					id: 'content',
					name: 'Content',
				},
			],
		});

		const { groups } = useRegisteredCommands(ref({ route: {} as RouteLocationNormalizedLoaded, search: '' }));

		await flushPromises();

		expect(groups.value.map(({ id }) => id)).toEqual(['content', 'settings']);
	});
});
