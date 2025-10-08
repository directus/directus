<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import HeaderBar from '../../components/header-bar.vue';
import { useNavBarStore } from '../stores/nav-bar';

defineProps<{ title?: string; shadow: boolean }>();

const menuBarStore = useNavBarStore();
</script>

<template>
	<HeaderBar small show-sidebar-toggle :shadow :title>
		<template #actions:append><slot name="actions:append" /></template>
		<template #actions:prepend><slot name="actions:prepend" /></template>
		<template #actions><slot name="actions" /></template>
		<template #headline><slot name="headline" /></template>
		<template #title-outer:append><slot name="title-outer:append" /></template>
		<template #title-outer:prepend>
			<VButton class="nav-toggle" icon rounded @click="menuBarStore.collapsed = !menuBarStore.collapsed">
				<VIcon :name="menuBarStore.collapsed ? 'left_panel_open' : 'left_panel_close'" />
			</VButton>

			<slot name="title-outer:prepend" />
		</template>
		<template #title:append><slot name="title:append" /></template>
		<template #title:prepend><slot name="title:prepend" /></template>
		<template #title><slot name="title" /></template>
	</HeaderBar>
</template>

<style scoped>
.nav-toggle {
	--v-button-color: var(--theme--foreground);
	--v-button-color-hover: var(--theme--foreground);
	--v-button-color-active: var(--theme--foreground);
	--v-button-background-color: transparent;
	--v-button-background-color-hover: var(--theme--background-normal);
	--v-button-background-color-active: var(--theme--background-normal);
}
</style>
