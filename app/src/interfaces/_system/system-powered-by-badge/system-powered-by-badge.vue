<script setup lang="ts">
import { computed } from 'vue';
import rawLogoSvg from '@/assets/logo-dark.svg?raw';
import { useServerStore } from '@/stores/server';

const logoSvg = rawLogoSvg.replace('<svg ', '<svg viewBox="0 0 64 39" ');

const serverStore = useServerStore();

const displayPoweredBy = computed(() => {
	if (!serverStore.info.license?.entitlements.display_powered_by) return null;

	return serverStore.info.license?.entitlements.display_powered_by;
});

const link = computed(() => {
	if (displayPoweredBy.value === 'DIRECTUS') return 'https://directus.io/';

	if (displayPoweredBy.value === 'OIG') return 'https://directus.io/oig';

	return '';
});
</script>

<template>
	<template v-if="displayPoweredBy === 'DIRECTUS' || displayPoweredBy === 'OIG'">
		<a :href="link" target="_blank" rel="noopener noreferrer">
			<div>
				<!-- eslint-disable-next-line vue/no-v-html -->
				<span class="directus-logo" aria-label="Directus" v-html="logoSvg" />
				{{
					displayPoweredBy === 'DIRECTUS'
						? $t('interfaces.powered-by-badge.directus')
						: $t('interfaces.powered-by-badge.oig')
				}}
			</div>
		</a>
	</template>
</template>

<style lang="scss" scoped>
a {
	position: fixed;
	z-index: 99;
	inset-block-end: 5rem;
	inset-inline-end: 4rem;
	background-color: var(--theme--background-normal);
	border-radius: var(--theme--border-radius);
	padding: 0.5rem 1rem;
	font-size: 0.6875rem;
	line-height: 1rem;
	font-weight: 600;
	cursor: pointer;
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
</style>
