<script setup lang="ts">
import PrivateViewNavProjectName from './private-view-nav-project-name.vue';
</script>

<template>
	<aside role="navigation" aria-label="Module Navigation" class="module-nav alt-colors">
		<PrivateViewNavProjectName />

		<div class="module-nav-content">
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
	--project-header-height: 60px;

	block-size: calc(100% - var(--project-header-height));
	overflow: hidden auto;
	border-inline-end: var(--theme--navigation--border-width) solid var(--theme--navigation--border-color);
}
</style>
