<script setup lang="ts">
import { computed } from 'vue';
import VIcon from './v-icon/v-icon.vue';
import { useServerStore } from '@/stores/server';

const { private: isPrivate = false } = defineProps<{ private?: boolean }>();

const serverStore = useServerStore();

const displayPoweredBy = computed(() => serverStore.info?.license?.entitlements?.display_powered_by);

const link = computed(() => {
	if (displayPoweredBy.value === 'DIRECTUS') return 'https://directus.io/';

	if (displayPoweredBy.value === 'OIG') return 'https://directus.io/oig';

	return '';
});
</script>

<template>
	<a
		v-if="displayPoweredBy === 'DIRECTUS' || displayPoweredBy === 'OIG'"
		:href="link"
		:class="{ private: isPrivate }"
		target="_blank"
		rel="noopener noreferrer"
	>
		<div class="link-inner">
			<VIcon name="directus" class="directus-logo" />
			{{ displayPoweredBy === 'DIRECTUS' ? $t('licensing.badge.directus') : $t('licensing.badge.oig') }}
		</div>
	</a>
</template>

<style lang="scss" scoped>
a {
	position: fixed;
	z-index: 99;
	inset-block-end: 4rem;
	inset-inline-end: 4rem;
	background-color: var(--theme--background);
	border-radius: var(--theme--border-radius);
	padding: 0.375rem 0;
	font-size: 0.6875rem;
	line-height: 1rem;
	font-weight: 600;
	cursor: pointer;

	div {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.directus-logo {
		display: inline-flex;
		inline-size: 1.125rem;
		color: var(--theme--foreground);

		:deep(svg) {
			inline-size: 100%;
			block-size: auto;
		}

		:deep(path) {
			fill: currentColor;
		}
	}

	&.private {
		position: relative;
		inset-block-end: unset;
		inset-inline-end: unset;
		background-color: var(--theme--background-normal);
		display: flex;
		justify-content: space-around;
		inline-size: 100%;
		white-space: nowrap;
	}
}
</style>
