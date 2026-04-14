import { createEventHook, useBreakpoints, useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BREAKPOINTS } from '@/constants';
import { useSidebarStore } from '@/views/private/private-view/stores/sidebar';

export const NAV_BAR_DEFAULT_SIZE = 225;
export const NAV_BAR_MIN_SIZE = 198;

export const useNavBarStore = defineStore('nav-bar-store', () => {
	const collapsed = useLocalStorage('nav-bar-collapsed', false);

	const storedSize = useLocalStorage('nav-bar-size', NAV_BAR_DEFAULT_SIZE);
	const enforceDefault = ref(false);

	const size = computed({
		get() {
			const val = storedSize.value;

			if (!Number.isFinite(val)) {
				storedSize.value = NAV_BAR_DEFAULT_SIZE;
				return NAV_BAR_DEFAULT_SIZE;
			}

			// Enforce default size when the nav bar is below the minimum size
			if (enforceDefault.value && val <= NAV_BAR_MIN_SIZE) {
				return NAV_BAR_DEFAULT_SIZE;
			}

			return val;
		},
		set(val: number) {
			if (Number.isFinite(val)) {
				// Remove default size enforcement once the nav bar is larger than the minimum size
				if (enforceDefault.value && val > NAV_BAR_MIN_SIZE) {
					enforceDefault.value = false;
				}

				storedSize.value = val;
			}
		},
	});

	const route = useRoute();
	const { lg, xl } = useBreakpoints(BREAKPOINTS);
	const sidebarStore = useSidebarStore();

	const inlineNav = computed(() => {
		return sidebarStore.collapsed ? lg.value : xl.value;
	});

	watch(
		() => route.fullPath,
		() => {
			if (!inlineNav.value) collapse();
		},
	);

	const collapseHook = createEventHook();
	const expandHook = createEventHook();

	const collapse = () => {
		if (collapsed.value === true) return;
		collapsed.value = true;
		collapseHook.trigger();
	};

	const expand = () => {
		if (collapsed.value === false) return;
		enforceDefault.value = true;
		collapsed.value = false;
		expandHook.trigger();
	};

	const toggle = () => {
		if (collapsed.value === true) expand();
		else collapse();
	};

	return {
		collapsed,
		size,
		collapse,
		expand,
		toggle,
		onCollapse: collapseHook.on,
		onExpand: expandHook.on,
	};
});
