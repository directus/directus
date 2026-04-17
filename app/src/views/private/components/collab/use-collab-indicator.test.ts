import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, nextTick, ref } from 'vue';
import { useCollabIndicator } from './use-collab-indicator';
import type { CollabUser } from '@/composables/use-collab';

const breakpointRefs = {
	xs: ref(false),
	sm: ref(false),
	lg: ref(false),
};

const headerBarInline = ref(false);

vi.mock('@vueuse/core', () => ({
	useBreakpoints: () => ({
		smallerOrEqual: (key: 'xs' | 'sm' | 'lg') => breakpointRefs[key],
	}),
}));

vi.mock('@/views/private/private-view/composables/use-header-bar', () => ({
	useInjectHeaderBarInline: () => headerBarInline,
}));

function setBreakpoint(width: 'xs' | 'sm' | 'lg' | 'xl') {
	breakpointRefs.xs.value = width === 'xs';
	breakpointRefs.sm.value = width === 'xs' || width === 'sm';
	breakpointRefs.lg.value = width === 'xs' || width === 'sm' || width === 'lg';
}

function makeUsers(count: number): CollabUser[] {
	return Array.from({ length: count }, (_, i) => ({
		id: `user-${i}`,
		connection: `conn-${i}` as CollabUser['connection'],
		color: 'red',
	}));
}

beforeEach(() => {
	setBreakpoint('xl');
	headerBarInline.value = false;
});

describe('indicatorLimit math', () => {
	it('returns 4 on wide screens when users fit within the limit', () => {
		const users = computed(() => makeUsers(4));
		const { indicatorLimit } = useCollabIndicator(users);
		expect(indicatorLimit.value).toBe(4);
	});

	it('reserves a slot for "+N" on wide screens when users exceed the limit', () => {
		const users = computed(() => makeUsers(5));
		const { indicatorLimit } = useCollabIndicator(users);
		expect(indicatorLimit.value).toBe(3);
	});

	it('returns 2 in minimal mode when users fit within the limit', () => {
		setBreakpoint('xs');
		const users = computed(() => makeUsers(2));
		const { indicatorLimit } = useCollabIndicator(users);
		expect(indicatorLimit.value).toBe(2);
	});

	it('reserves a slot for "+N" in minimal mode when users exceed the limit', () => {
		setBreakpoint('xs');
		const users = computed(() => makeUsers(3));
		const { indicatorLimit } = useCollabIndicator(users);
		expect(indicatorLimit.value).toBe(1);
	});
});

describe('shouldDisplayMinimal — not inline', () => {
	const users = computed(() => makeUsers(1));

	it('is minimal at xs', () => {
		setBreakpoint('xs');
		const { indicatorLimit } = useCollabIndicator(users);
		expect(indicatorLimit.value).toBe(2);
	});

	it('is full between xs and sm', () => {
		setBreakpoint('sm');
		const { indicatorLimit } = useCollabIndicator(users);
		expect(indicatorLimit.value).toBe(4);
	});

	it('is minimal between sm and lg', () => {
		setBreakpoint('lg');
		const { indicatorLimit } = useCollabIndicator(users);
		expect(indicatorLimit.value).toBe(2);
	});

	it('is full above lg', () => {
		setBreakpoint('xl');
		const { indicatorLimit } = useCollabIndicator(users);
		expect(indicatorLimit.value).toBe(4);
	});
});

describe('shouldDisplayMinimal — inline (drawer)', () => {
	const users = computed(() => makeUsers(1));

	beforeEach(() => {
		headerBarInline.value = true;
	});

	it.each(['xs', 'sm', 'lg'] as const)('is minimal at %s', (bp) => {
		setBreakpoint(bp);
		const { indicatorLimit } = useCollabIndicator(users);
		expect(indicatorLimit.value).toBe(2);
	});

	it('is full above lg', () => {
		setBreakpoint('xl');
		const { indicatorLimit } = useCollabIndicator(users);
		expect(indicatorLimit.value).toBe(4);
	});
});

describe('reactivity', () => {
	it('recomputes when the users array crosses the limit', async () => {
		const count = ref(4);
		const users = computed(() => makeUsers(count.value));
		const { indicatorLimit } = useCollabIndicator(users);

		expect(indicatorLimit.value).toBe(4);

		count.value = 5;
		await nextTick();
		expect(indicatorLimit.value).toBe(3);
	});

	it('recomputes when a breakpoint flips', async () => {
		const users = computed(() => makeUsers(1));
		const { indicatorLimit } = useCollabIndicator(users);

		expect(indicatorLimit.value).toBe(4);

		setBreakpoint('xs');
		await nextTick();
		expect(indicatorLimit.value).toBe(2);
	});
});
