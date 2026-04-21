<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import VIcon from '@/components/v-icon/v-icon.vue';

const props = defineProps<{
	labelKey: 'brand_directus_label' | 'brand_oig_label';
	type?: 'accent' | 'normal';
}>();

const { t } = useI18n();
</script>

<template>
	<a
		class="powered-by-directus"
		:class="type === 'normal' ? 'type-normal' : 'type-accent'"
		href="https://directus.io"
		target="_blank"
		rel="noopener noreferrer"
	>
		<VIcon name="directus" class="icon" small />
		<span class="text">{{ t(props.labelKey) }}</span>
	</a>
</template>

<style scoped>
.powered-by-directus {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.5rem;
	inline-size: fit-content;
	padding: 0.625rem 1.125rem;
	border-radius: var(--theme--border-radius);
	color: var(--theme--foreground);
	font-size: 0.6875rem;
	font-weight: 600;
	line-height: 1.2;
	text-decoration: none;
	transition: opacity var(--fast) var(--transition);
}

.type-accent {
	background-color: var(--theme--background-accent);
}

.type-normal {
	background-color: var(--theme--background);
}

.powered-by-directus:hover {
	opacity: 0.9;
}

.icon {
	--v-icon-color: var(--theme--foreground);

	flex-shrink: 0;
}

.text {
	white-space: nowrap;
}
</style>
