import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, nextTick, ref } from 'vue';
import type { CollabUser } from './types';
import { useCollabIndicator } from './use-collab-indicator';

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

describe('visible/more split', () => {
	it('shows all users on wide screens when count fits within the limit', () => {
		const users = computed(() => makeUsers(4));
		const { visibleUsers, moreUsers } = useCollabIndicator(users);
		expect(visibleUsers.value).toHaveLength(4);
		expect(moreUsers.value).toHaveLength(0);
	});

	it('reserves a slot for "+N" on wide screens when count exceeds the limit', () => {
		const users = computed(() => makeUsers(5));
		const { visibleUsers, moreUsers } = useCollabIndicator(users);
		expect(visibleUsers.value).toHaveLength(3);
		expect(moreUsers.value).toHaveLength(2);
	});

	it('shows all users in minimal mode when count fits within the limit', () => {
		setBreakpoint('xs');
		const users = computed(() => makeUsers(2));
		const { visibleUsers, moreUsers } = useCollabIndicator(users);
		expect(visibleUsers.value).toHaveLength(2);
		expect(moreUsers.value).toHaveLength(0);
	});

	it('reserves a slot for "+N" in minimal mode when count exceeds the limit', () => {
		setBreakpoint('xs');
		const users = computed(() => makeUsers(3));
		const { visibleUsers, moreUsers } = useCollabIndicator(users);
		expect(visibleUsers.value).toHaveLength(1);
		expect(moreUsers.value).toHaveLength(2);
	});
});

describe('shouldDisplayMinimal — not inline', () => {
	const users = computed(() => makeUsers(5));

	it('is minimal at xs', () => {
		setBreakpoint('xs');
		const { visibleUsers } = useCollabIndicator(users);
		expect(visibleUsers.value).toHaveLength(1);
	});

	it('is full between xs and sm', () => {
		setBreakpoint('sm');
		const { visibleUsers } = useCollabIndicator(users);
		expect(visibleUsers.value).toHaveLength(3);
	});

	it('is minimal between sm and lg', () => {
		setBreakpoint('lg');
		const { visibleUsers } = useCollabIndicator(users);
		expect(visibleUsers.value).toHaveLength(1);
	});

	it('is full above lg', () => {
		setBreakpoint('xl');
		const { visibleUsers } = useCollabIndicator(users);
		expect(visibleUsers.value).toHaveLength(3);
	});
});

describe('shouldDisplayMinimal — inline (drawer)', () => {
	const users = computed(() => makeUsers(5));

	beforeEach(() => {
		headerBarInline.value = true;
	});

	it.each(['xs', 'sm', 'lg'] as const)('is minimal at %s', (bp) => {
		setBreakpoint(bp);
		const { visibleUsers } = useCollabIndicator(users);
		expect(visibleUsers.value).toHaveLength(1);
	});

	it('is full above lg', () => {
		setBreakpoint('xl');
		const { visibleUsers } = useCollabIndicator(users);
		expect(visibleUsers.value).toHaveLength(3);
	});
});

describe('reactivity', () => {
	it('recomputes when the users array crosses the limit', async () => {
		const count = ref(4);
		const users = computed(() => makeUsers(count.value));
		const { visibleUsers, moreUsers } = useCollabIndicator(users);

		expect(visibleUsers.value).toHaveLength(4);
		expect(moreUsers.value).toHaveLength(0);

		count.value = 5;
		await nextTick();
		expect(visibleUsers.value).toHaveLength(3);
		expect(moreUsers.value).toHaveLength(2);
	});

	it('recomputes when a breakpoint flips', async () => {
		const users = computed(() => makeUsers(5));
		const { visibleUsers } = useCollabIndicator(users);

		expect(visibleUsers.value).toHaveLength(3);

		setBreakpoint('xs');
		await nextTick();
		expect(visibleUsers.value).toHaveLength(1);
	});
});
