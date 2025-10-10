<script setup lang="ts">
import SkipMenu from '../../components/skip-menu.vue';
import ProjectInfo from '../../components/project-info.vue';
import { useNavBarStore } from '../stores/nav-bar';

const menuBarStore = useNavBarStore();
</script>

<template>
	<aside role="navigation" aria-label="Module Navigation" class="module-nav alt-colors">
		<SkipMenu section="moduleNav" />

		<div class="nav-header-container">
			<ProjectInfo />
			<VButton class="nav-toggle" icon rounded small @click="menuBarStore.collapsed = !menuBarStore.collapsed">
				<VIcon :name="menuBarStore.collapsed ? 'left_panel_open' : 'left_panel_close'" small />
			</VButton>

		</div>

		<div id="module-navigation" class="module-nav-content">
			<slot name="navigation" />
		</div>
	</aside>
</template>

<style scoped>
.module-nav {
	block-size: 100%;
	inline-size: 100%;
	position: relative;
	display: block;
	font-size: 1rem;
	background: var(--theme--navigation--background);
}

.module-nav-content {
	--v-list-item-color: var(--theme--navigation--list--foreground);
	--v-list-item-color-hover: var(--theme--navigation--list--foreground-hover);
	--v-list-item-color-active: var(--theme--navigation--list--foreground-active);
	--v-list-item-icon-color: var(--theme--navigation--list--icon--foreground);
	--v-list-item-icon-color-hover: var(--theme--navigation--list--icon--foreground-hover);
	--v-list-item-icon-color-active: var(--theme--navigation--list--icon--foreground-active);
	--v-list-item-background-color: var(--theme--navigation--list--background);
	--v-list-item-background-color-hover: var(--theme--navigation--list--background-hover);
	--v-list-item-background-color-active: var(--theme--navigation--list--background-active);
	--v-divider-color: var(--theme--navigation--list--divider--border-color);
	--v-divider-thickness: var(--theme--navigation--list--divider--border-width);
	--project-header-height: 52px;

	block-size: calc(100% - var(--project-header-height));
	overflow: hidden auto;
}

.nav-header-container {
	position: relative;
	display: flex;
	align-items: center;
	inline-size: 100%;
	block-size: calc(52px + var(--theme--navigation--project--border-width));
	padding-inline-start: 24px;
	padding-inline-end: 12px;
	color: var(--theme--navigation--project--foreground);
	text-align: start;
	background: var(--theme--navigation--project--background);
	border-block-end: var(--theme--navigation--project--border-width) solid
		var(--theme--navigation--project--border-color);
}

.nav-toggle {
	--v-button-color: var(--theme--foreground);
	--v-button-color-hover: var(--theme--foreground);
	--v-button-color-active: var(--theme--foreground);
	--v-button-background-color: transparent;
	--v-button-background-color-hover: var(--theme--background-normal);
	--v-button-background-color-active: var(--theme--background-normal);
}
</style>
