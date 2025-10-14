import { useLocalStorage, createEventHook } from "@vueuse/core";
import { defineStore } from "pinia";

export const useSidebarStore = defineStore('sidebar-store', () => {
	const collapsed = useLocalStorage('sidebar-collapsed', false);
	const size = useLocalStorage('sidebar-size', 250);

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
