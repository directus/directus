import { createEventHook, useBreakpoints, useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BREAKPOINTS } from '@/constants';
import { useSidebarStore } from '@/views/private/private-view/stores/sidebar';

export const useNavBarStore = defineStore('nav-bar-store', () => {
	const collapsed = useLocalStorage('nav-bar-collapsed', false);

	const DEFAULT_SIZE = 250;
	const storedSize = useLocalStorage('nav-bar-size', DEFAULT_SIZE);

	const size = computed({
		get() {
			const val = storedSize.value;

			if (!Number.isFinite(val)) {
				storedSize.value = DEFAULT_SIZE;
				return DEFAULT_SIZE;
			}

			return val;
		},
		set(val: number) {
			if (Number.isFinite(val)) storedSize.value = val;
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
