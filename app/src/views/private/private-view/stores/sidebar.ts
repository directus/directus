import { createEventHook, useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useSidebarStore = defineStore('sidebar-store', () => {
	const collapsed = useLocalStorage('sidebar-collapsed', false);
	const size = useLocalStorage('sidebar-size', 250);

	const aiChatActive = ref<boolean>(false);

	watch(aiChatActive, (newActive) => {
		if (newActive) expand();
	});

	const activeAccordionItem = ref<string>();

	watch(activeAccordionItem, (newActiveItem) => {
		if (newActiveItem) expand();
	});

	watch(collapsed, (newCollapsed) => {
		if (newCollapsed) {
			activeAccordionItem.value = undefined;
			aiChatActive.value = false;
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
		aiChatActive,
	};
});
