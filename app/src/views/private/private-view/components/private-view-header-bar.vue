<script setup lang="ts">
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import HeaderBar from '../../components/header-bar.vue';

const props = defineProps<{ title?: string }>();
</script>

<template>
	<HeaderBar
		small
		show-sidebar-toggle
		:shadow="false"
		:title="props.title"
	>
		<template #actions:append><slot name="actions:append" /></template>
		<template #actions:prepend><slot name="actions:prepend" /></template>
		<template #actions><slot name="actions" /></template>
		<template #headline><slot name="headline" /></template>
		<template #title-outer:append><slot name="title-outer:append" /></template>
		<template #title-outer:prepend>
			<VButton secondary class="nav-toggle" icon rounded @click="$emit('primary')">
				<VIcon name="menu" />
			</VButton>

			<slot name="title-outer:prepend" />
		</template>
		<template #title:append><slot name="title:append" /></template>
		<template #title:prepend><slot name="title:prepend" /></template>
		<template #title><slot name="title" /></template>
	</HeaderBar>
</template>
