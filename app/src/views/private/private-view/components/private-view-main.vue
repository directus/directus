<script setup lang="ts">
import SkipMenu from '../../components/skip-menu.vue';
import PrivateViewHeaderBar from './private-view-header-bar.vue';
import { provide, useTemplateRef } from 'vue';
import type { PrivateViewProps } from './private-view.vue';

const contentEl = useTemplateRef('contentEl');
provide('main-element', contentEl);

const props = defineProps<PrivateViewProps>();

defineOptions({ inheritAttrs: false });
</script>

<template>
	<SkipMenu section="main" />

	<div id="main-content" ref="contentEl" class="content">
		<PrivateViewHeaderBar :title="props.title">
			<template #actions:append><slot name="actions:append" /></template>
			<template #actions:prepend><slot name="actions:prepend" /></template>
			<template #actions><slot name="actions" /></template>
			<template #headline><slot name="headline" /></template>
			<template #title-outer:append><slot name="title-outer:append" /></template>
			<template #title-outer:prepend><slot name="title-outer:prepend" /></template>
			<template #title:append><slot name="title:append" /></template>
			<template #title:prepend><slot name="title:prepend" /></template>
			<template #title><slot name="title" /></template>
		</PrivateViewHeaderBar>

		<div class="content-wrapper">
			<main>
				<slot />
			</main>
		</div>
	</div>
</template>
