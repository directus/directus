import { useLocalStorage, createEventHook, useBreakpoints } from '@vueuse/core';
import { defineStore } from 'pinia';
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { BREAKPOINTS } from '@/constants';

export const useNavBarStore = defineStore('nav-bar-store', () => {
	const collapsed = useLocalStorage('nav-bar-collapsed', false);
	const size = useLocalStorage('nav-bar-size', 250);

	const route = useRoute();
	const breakpoints = useBreakpoints(BREAKPOINTS);

	watch(
		() => route.fullPath,
		() => {
			if (breakpoints.smaller('lg').value) collapse();
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
