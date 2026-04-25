import { useBreakpoints } from '@vueuse/core';
import { computed, type ComputedRef } from 'vue';
import { BREAKPOINTS } from '@/constants';
import { useInjectHeaderBarInline } from '@/views/private/private-view/composables/use-header-bar';

type UseCollabIndicatorReturn<T> = {
	visibleUsers: ComputedRef<T[]>;
	moreUsers: ComputedRef<T[]>;
};

export function useCollabIndicator<T>(users: ComputedRef<T[]>): UseCollabIndicatorReturn<T> {
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

	const visibleUsers = computed(() => users.value.slice(0, indicatorLimit.value));
	const moreUsers = computed(() => users.value.slice(indicatorLimit.value));

	return { visibleUsers, moreUsers };

	function shouldDisplayMinimal() {
		if (headerBarInline.value) return lteLarge.value;
		return lteXSmall.value || (!lteSmall.value && lteLarge.value);
	}
}
