import { createEventHook, useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

export const SIDEBAR_DEFAULT_SIZE = 333;
export const SIDEBAR_MIN_SIZE = 252;

export const useSidebarStore = defineStore('sidebar-store', () => {
	const collapsed = useLocalStorage('sidebar-collapsed', false);

	const storedSize = useLocalStorage('sidebar-size', SIDEBAR_DEFAULT_SIZE);
	const enforceDefault = ref(false);

	const size = computed({
		get() {
			const val = storedSize.value;

			if (!Number.isFinite(val)) {
				storedSize.value = SIDEBAR_DEFAULT_SIZE;
				return SIDEBAR_DEFAULT_SIZE;
			}

			// Enforce default size when the sidebar is below the minimum size
			if (enforceDefault.value && val <= SIDEBAR_MIN_SIZE) {
				return SIDEBAR_DEFAULT_SIZE;
			}

			return val;
		},
		set(val: number) {
			if (Number.isFinite(val)) {
				// Remove default size enforcement once the sidebar is larger than the minimum size
				if (enforceDefault.value && val > SIDEBAR_MIN_SIZE) {
					enforceDefault.value = false;
				}

				storedSize.value = val;
			}
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
			enforceDefault.value = true;
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
		enforceDefault.value = true;
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
