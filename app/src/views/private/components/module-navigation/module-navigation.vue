<script setup lang="ts">
import ModuleNavigationHeader from './module-navigation-header.vue';
</script>

<template>
	<div class="module-nav alt-colors">
		<ModuleNavigationHeader />

		<div class="module-nav-content">
			<slot name="navigation" />
		</div>
	</div>
</template>

<style scoped>
.module-nav {
	position: relative;
	display: inline-block;
	width: 280px;
	height: 100%;
	font-size: 1rem;
	background-color: var(--background-normal);
	padding: 8px;
}

.module-nav-content {
	--v-list-item-background-color-hover: var(--background-normal-alt);
	--v-list-item-background-color-active: var(--background-normal-alt);

	height: calc(100% - 64px);
	overflow-x: hidden;
	overflow-y: auto;
}
</style>
