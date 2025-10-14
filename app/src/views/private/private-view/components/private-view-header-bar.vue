<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import HeaderBar from '../../components/header-bar.vue';
import { useNavBarStore } from '../stores/nav-bar';
import { computed } from 'vue';
import { useSidebarStore } from '../stores/sidebar';
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core';

const navBarStore = useNavBarStore();
const sidebarStore = useSidebarStore();

const { sm } = useBreakpoints(breakpointsTailwind);

const props = defineProps<{ title?: string, shadow: boolean, inlineNav: boolean }>();

const showNavToggle = computed(() => {
	if (props.inlineNav) {
		return navBarStore.collapsed;
	}

	return true;
});

const showSidebarToggle = computed(() => {
	return !sm.value;
});
</script>

<template>
	<HeaderBar
		small
		show-sidebar-toggle
		:shadow
		:title
	>
		<template #actions:append>
			<VIcon v-if="showSidebarToggle" name="menu_open" clickable @click="sidebarStore.expand" />
			<slot name="actions:append" />
		</template>
		<template #actions:prepend><slot name="actions:prepend" /></template>
		<template #actions><slot name="actions" /></template>
		<template #headline><slot name="headline" /></template>
		<template #title-outer:append><slot name="title-outer:append" /></template>
		<template #title-outer:prepend>
			<VIcon v-if="showNavToggle" name="left_panel_open" clickable @click="navBarStore.expand" />
			<slot name="title-outer:prepend" />
		</template>
		<template #title:append><slot name="title:append" /></template>
		<template #title:prepend><slot name="title:prepend" /></template>
		<template #title><slot name="title" /></template>
	</HeaderBar>
</template>
