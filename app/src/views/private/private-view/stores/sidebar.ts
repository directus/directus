import { createEventHook, useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

export const useSidebarStore = defineStore('sidebar-store', () => {
	const collapsed = useLocalStorage('sidebar-collapsed', false);

	const DEFAULT_SIZE = 370;
	const storedSize = useLocalStorage('sidebar-size', DEFAULT_SIZE);

	const size = computed({
		get() {
			const val = storedSize.value;
			return Number.isFinite(val) ? val : DEFAULT_SIZE;
		},
		set(val: number) {
			if (Number.isFinite(val)) storedSize.value = val;
		},
	});

	const activeAccordionItem = ref<string>();

	watch(activeAccordionItem, (newActiveItem) => {
		if (newActiveItem) expand();
	});

	watch(collapsed, (newCollapsed) => {
		if (newCollapsed) {
			activeAccordionItem.value = undefined;
			collapseHook.trigger();
		} else {
			expandHook.trigger();
		}
	});

	const collapseHook = createEventHook();
	const expandHook = createEventHook();

	const collapse = () => {
		if (collapsed.value === true) return;
		collapsed.value = true;
	};

	const expand = () => {
		if (collapsed.value === false) return;
		collapsed.value = false;
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
		activeAccordionItem,
	};
});
