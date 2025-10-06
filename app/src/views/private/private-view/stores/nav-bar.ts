import { useLocalStorage, createEventHook } from "@vueuse/core";
import { defineStore } from "pinia";

export const useNavBarStore = defineStore('nav-bar-store', () => {
	const collapsed = useLocalStorage('nav-bar-collapsed', false);
	const size = useLocalStorage('nav-bar-size', 250);

	const collapseHook = createEventHook();
	const expandHook = createEventHook();

	const collapse = () => {
		collapsed.value = true;
		collapseHook.trigger();
	};

	const expand = () => {
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
