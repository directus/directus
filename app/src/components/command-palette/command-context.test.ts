import { describe, expect, test } from 'vitest';
import { computed, nextTick, reactive, watch } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { getCommandContext } from './command-context';

describe('getCommandContext', () => {
	test('updates computed command context after route-only navigation', async () => {
		const route = reactive({
			fullPath: '/content/posts',
		}) as RouteLocationNormalizedLoaded;

		const observedRoutePaths: string[] = [];
		const context = computed(() => getCommandContext(route, ''));

		watch(
			context,
			(value) => {
				observedRoutePaths.push(value.routePath);
			},
			{ immediate: true },
		);

		route.fullPath = '/content/pages';
		await nextTick();

		expect(observedRoutePaths).toEqual(['/content/posts', '/content/pages']);
	});
});
