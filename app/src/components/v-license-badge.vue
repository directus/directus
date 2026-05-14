<script setup lang="ts">
import { computed } from 'vue';
import rawLogoSvg from '@/assets/logo-dark.svg?raw';
import { useServerStore } from '@/stores/server';

const { private: isPrivate = false } = defineProps<{ private?: boolean }>();

const logoSvg = rawLogoSvg.replace('<svg ', '<svg viewBox="0 0 64 39" ');

const serverStore = useServerStore();

const displayPoweredBy = computed(() => serverStore.info?.license?.entitlements?.display_powered_by);

const link = computed(() => {
	if (displayPoweredBy.value === 'DIRECTUS') return 'https://directus.io/';

	if (displayPoweredBy.value === 'OIG') return 'https://directus.io/oig';

	return '';
});
</script>

<template>
	<template v-if="displayPoweredBy === 'DIRECTUS' || displayPoweredBy === 'OIG'">
		<div class="wrapper" :class="{ private: isPrivate }">
			<hr />
			<a :href="link" target="_blank" rel="noopener noreferrer">
				<div class="link-inner">
					<!-- eslint-disable-next-line vue/no-v-html -->
					<span class="directus-logo" aria-label="Directus" v-html="logoSvg" />
					{{
						displayPoweredBy === 'DIRECTUS'
							? $t('interfaces.powered-by-badge.directus')
							: $t('interfaces.powered-by-badge.oig')
					}}
				</div>
			</a>
		</div>
	</template>
</template>

<style lang="scss" scoped>
.wrapper {
	&.private {
		padding-block-end: 0.6875rem;
		gap: 0.6875rem;
		display: flex;
		position: relative;
		flex-direction: column;
	}

	hr {
		flex-grow: 1;
		max-inline-size: 100%;
		border: solid;
		border-color: var(--theme--navigation--list--divider--border-color);
		border-width: var(--theme--border-width) 0 0 0;
		inline-size: calc(100% - 2.25rem);
		align-self: center;
	}

	a {
		position: fixed;
		z-index: 99;
		inset-block-end: 4rem;
		inset-inline-end: 4rem;
		background-color: var(--theme--background);
		border-radius: var(--theme--border-radius);
		padding: 0.5rem 1.2rem;
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
	}

	&.private a {
		position: relative;
		inset-block-end: unset;
		inset-inline-end: unset;
		background-color: var(--theme--background-normal);
		display: inline-flex;
		align-self: center;
		white-space: nowrap;
	}
}
</style>
