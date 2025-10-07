<script lang="ts">
export interface PrivateViewProps {
	title?: string,
}
</script>

<script setup lang="ts">
import PrivateViewNoAppAccess from './private-view-no-app-access.vue';
import PrivateViewRoot from './private-view-root.vue';
import { useUserStore } from '@/stores/user';
import { computed } from 'vue';

const userStore = useUserStore();

const appAccess = computed(() => {
	if (!userStore.currentUser) return true;
	return userStore.currentUser?.app_access || false;
});

defineProps<PrivateViewProps>();
</script>

<template>
	<PrivateViewNoAppAccess v-if="appAccess === false" />
	<PrivateViewRoot v-else v-bind="$props">
		<template #navigation><slot name="navigation" /></template>
		<template #actions:append><slot name="actions:append" /></template>
		<template #actions:prepend><slot name="actions:prepend" /></template>
		<template #actions><slot name="actions" /></template>
		<template #headline><slot name="headline" /></template>
		<template #title-outer:append><slot name="title-outer:append" /></template>
		<template #title-outer:prepend><slot name="title-outer:prepend" /></template>
		<template #title:append><slot name="title:append" /></template>
		<template #title:prepend><slot name="title:prepend" /></template>
		<template #title><slot name="title" /></template>
		<template #sidebar><slot name="sidebar" /></template>

		<slot />
	</PrivateViewRoot>
</template>
