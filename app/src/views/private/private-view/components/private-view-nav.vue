<script setup lang="ts">
import { computed } from 'vue';
import PrivateViewNavProjectName from './private-view-nav-project-name.vue';
import PoweredByDirectus from '@/components/powered-by-directus.vue';
import { useServerStore } from '@/stores/server';

// id attribute for accessibility linking doesn’t work on the top-level element
defineProps<{ id?: string }>();

const serverStore = useServerStore();

const brandingLabelKey = computed(() => serverStore.info.branding_label_key ?? null);
</script>

<template>
	<aside role="navigation" aria-label="Module Navigation" class="module-nav alt-colors">
		<PrivateViewNavProjectName />

		<div :id class="module-nav-content">
			<slot name="navigation" />
		</div>

		<div v-if="brandingLabelKey" class="module-nav-footer">
			<PoweredByDirectus :label-key="brandingLabelKey" class="powered-by-directus" />
		</div>
	</aside>
</template>

<style scoped>
.module-nav {
	display: flex;
	flex-direction: column;
	inline-size: 100%;
	block-size: 100%;
	font-size: 0.8125rem;
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
	flex-grow: 1;
	min-block-size: 0;
	overflow: hidden auto;
	border-inline-end: var(--theme--navigation--border-width) solid var(--theme--navigation--border-color);
}

.module-nav-footer {
	position: relative;
	display: flex;
	justify-content: center;
	flex-shrink: 0;
	padding: 1.2rem 1rem 0.6rem;
	border-inline-end: var(--theme--navigation--border-width) solid var(--theme--navigation--border-color);

	&::before {
		position: absolute;
		inset-block-start: 0.625rem;
		inset-inline: 1rem;
		block-size: 0.0625rem;
		background-color: var(--theme--border-color);
		content: '';
	}

	:deep(.powered-by-directus) {
		inline-size: 100%;
		justify-content: center;
	}
}

.powered-by-directus {
	inline-size: 100%;
}
</style>
