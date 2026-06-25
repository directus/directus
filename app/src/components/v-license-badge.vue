<script setup lang="ts">
import { DIRECTUS_HOME_URL, DIRECTUS_OIG_URL } from '@directus/constants';
import { computed } from 'vue';
import VIcon from './v-icon/v-icon.vue';
import { useServerStore } from '@/stores/server';

const { private: isPrivate = false } = defineProps<{ private?: boolean }>();

const serverStore = useServerStore();

const displayPoweredBy = computed(() => serverStore.info?.license?.entitlements?.display_powered_by);

const link = computed(() => {
	if (displayPoweredBy.value === 'DIRECTUS') return DIRECTUS_HOME_URL;
	if (displayPoweredBy.value === 'OIG') return DIRECTUS_OIG_URL;
	return '';
});
</script>

<template>
	<div v-if="displayPoweredBy === 'DIRECTUS' || displayPoweredBy === 'OIG'" class="license-badge">
		<hr v-if="isPrivate" class="badge-divider" />
		<a :href="link" :class="{ private: isPrivate }" target="_blank" rel="noopener noreferrer">
			<div class="link-inner">
				<VIcon name="directus" class="directus-logo" />
				{{ displayPoweredBy === 'DIRECTUS' ? $t('licensing.badge.directus') : $t('licensing.badge.oig') }}
			</div>
		</a>
	</div>
</template>

<style lang="scss" scoped>
.license-badge {
	display: flex;
	flex-direction: column;
	gap: 0.6565rem;
}

.badge-divider {
	inline-size: calc(100% - 0.875rem);
	align-self: center;
	border: solid;
	border-color: var(--theme--navigation--list--divider--border-color);
	border-width: var(--theme--border-width) 0 0 0;
}

a {
	position: fixed;
	z-index: 99;
	inset-block-end: var(--public-view--container--padding-y);
	inset-inline-end: var(--public-view--container--padding-x);
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);
	padding: 0.375rem 1.2rem;
	font-size: 0.6875rem;
	line-height: 1rem;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background-color: var(--theme--background-accent);
	}

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
		display: flex;
		justify-content: space-around;
		inline-size: 100%;
		white-space: nowrap;
		padding-inline: unset;
	}
}
</style>
