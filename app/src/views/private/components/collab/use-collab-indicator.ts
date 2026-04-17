import { useBreakpoints } from '@vueuse/core';
import { computed, type ComputedRef } from 'vue';
import type { CollabUser } from '@/composables/use-collab';
import { BREAKPOINTS } from '@/constants';
import { useInjectHeaderBarInline } from '@/views/private/private-view/composables/use-header-bar';

export function useCollabIndicator(users: ComputedRef<CollabUser[]>) {
	const headerBarInline = useInjectHeaderBarInline();
	const breakpoints = useBreakpoints(BREAKPOINTS);
	const lteXSmall = breakpoints.smallerOrEqual('xs');
	const lteSmall = breakpoints.smallerOrEqual('sm');
	const lteLarge = breakpoints.smallerOrEqual('lg');

	const indicatorLimit = computed(() => {
		const actualLimit = shouldDisplayMinimal() ? 2 : 4;
		if (users.value.length > actualLimit) return actualLimit - 1;
		return actualLimit;
	});

	return { indicatorLimit };

	function shouldDisplayMinimal() {
		if (headerBarInline.value) return lteLarge.value;
		return lteXSmall.value || (!lteSmall.value && lteLarge.value);
	}
}
