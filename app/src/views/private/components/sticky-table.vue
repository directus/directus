<script setup lang="ts">
import { useElementBounding, useEventListener, useMutationObserver } from '@vueuse/core';
import { computed, onMounted, ref, watch } from 'vue';

withDefaults(
	defineProps<{
		stickyTop?: string;
	}>(),
	{
		stickyTop: '0',
	},
);

const tableContainer = ref<HTMLDivElement | null>(null);
const table = ref<HTMLTableElement | null>(null);
const headerContainer = ref<HTMLDivElement | null>(null);
const header = ref<HTMLDivElement | null>(null);
const headerOriginal = ref<HTMLTableSectionElement | null>(null);
const lastRow = ref<HTMLTableRowElement | null>(null);

onMounted(() => {
	const updateElements = () => {
		if (!table.value) return;

		headerOriginal.value = table.value.querySelector(':scope > thead');
		lastRow.value = table.value.querySelector(':scope > tbody > tr:last-child');
	};

	useMutationObserver(table, updateElements, {
		childList: true,
		subtree: true,
	});

	updateElements();
});

useEventListener(tableContainer, 'scroll', () =>
	window.requestAnimationFrame(() => {
		if (!header.value || !tableContainer.value) return;

		header.value.scrollLeft = tableContainer.value.scrollLeft;
	}),
);

const { height: tableHeight } = useElementBounding(table);
const { top: lastRowTop } = useElementBounding(lastRow);
const { height: headerHeight } = useElementBounding(headerOriginal);

const headerContainerHeight = computed(() => {
	if (!lastRow.value || !table.value) return;

	const height = lastRowTop.value - table.value.getBoundingClientRect().top;

	const outerBorder = getComputedStyle(lastRow.value).borderTopWidth;
	const cell = lastRow.value.firstElementChild;
	const innerBorder = cell ? getComputedStyle(cell).borderTopWidth : '0px';

	return `calc(${height}px + ${outerBorder} + ${innerBorder})`;
});

watch(
	[headerContainer, headerContainerHeight, tableHeight],
	([headerContainer, headerContainerHeight, tableHeight]) => {
		if (!headerContainer) return;

		headerContainer.style.height = headerContainerHeight ?? `${tableHeight}px`;
	},
);

watch([header, headerOriginal, headerHeight, table, tableHeight], ([header, headerOriginal, headerHeight, table]) => {
	if (!header || !headerOriginal || !table) return;

	const spacingTop = headerOriginal.getBoundingClientRect().top - table.getBoundingClientRect().top;

	header.style.height = `${spacingTop + headerHeight}px`;
});
</script>

<template>
	<div class="main-container">
		<div ref="tableContainer" class="table-container">
			<table ref="table">
				<slot />
			</table>
		</div>
		<div ref="headerContainer" class="header-container">
			<div ref="header" class="header">
				<table>
					<slot />
				</table>
			</div>
		</div>
	</div>
</template>

<style scoped>
.main-container {
	position: relative;

	.table-container {
		overflow: auto;
		/*
		 * disable scroll "bounce" effect
		 * - to prevent overflow of fixed header
		 * - for immediate scroll sync
		 */
		overscroll-behavior-x: none;

		> table {
			:slotted(> thead) {
				visibility: hidden;
			}
		}
	}

	.header-container {
		position: absolute;
		top: 0;
		width: 100%;
		pointer-events: none;

		.header {
			position: sticky;
			top: v-bind(stickyTop);
			overflow: hidden;
			pointer-events: auto;

			> table {
				border-color: transparent;

				:slotted(> *:not(thead)) {
					visibility: hidden;
				}
			}
		}
	}
}
</style>
