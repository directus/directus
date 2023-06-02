<script setup lang="ts">
import ModuleNavigationHeaderLogo from './module-navigation-header-logo.vue';
import ModuleNavigationHeaderProjectName from './module-navigation-header-project-name.vue';
import ModuleNavigationHeaderUserMenu from './module-navigation-header-user-menu.vue';
</script>

<template>
	<div class="module-navigation-header">
		<ModuleNavigationHeaderLogo />
		<ModuleNavigationHeaderProjectName />
		<ModuleNavigationHeaderUserMenu />
	</div>
</template>

<style scoped>
.module-navigation-header {
	display: grid;
	gap: 12px;
	grid-template-columns: auto 1fr auto;
	align-items: center;
}
</style>
