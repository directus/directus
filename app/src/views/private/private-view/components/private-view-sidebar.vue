<script lang="ts" setup>
import SkipMenu from '../../components/skip-menu.vue';
import { AccordionRoot } from 'reka-ui';
</script>

<template>
	<aside id="sidebar" ref="sidebarEl" role="contentinfo" class="alt-colors" aria-label="Module Sidebar">
		<SkipMenu section="sidebar" />
		<AccordionRoot type="single" collapsible>
			<slot name="sidebar" />
		</AccordionRoot>
	</aside>
</template>

<style scoped>
#sidebar {
	inline-size: 100%;
	block-size: 100%;
	overflow: hidden;
	background-color: var(--theme--sidebar--background);
	font-family: var(--theme--sidebar--font-family);
	border-inline-start: var(--theme--sidebar--border-width) solid var(--theme--sidebar--border-color);
	min-inline-size: 250px;

	/* Explicitly render the border outside of the width of the bar itself */
	box-sizing: content-box;
}
</style>
