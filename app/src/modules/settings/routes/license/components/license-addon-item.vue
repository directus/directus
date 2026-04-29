<script setup lang="ts">
import type { LicenseAddon } from '@directus/sdk';
import { useI18n } from 'vue-i18n';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';

defineProps<{
	addon: LicenseAddon;
}>();

const { t } = useI18n();
</script>

<template>
	<VListItem class="license-addon-item" block>
		<div class="addon-icon">
			<VIcon :name="addon.icon" />
		</div>
		<VListItemContent>
			<div class="addon-name">{{ addon.name }}</div>
			<div class="addon-pricing">{{ addon.pricing_summary }}</div>
		</VListItemContent>
		<VButton secondary>
			<VIcon name="add_shopping_cart" left />
			{{ t('licensing.addon_purchase') }}
		</VButton>
	</VListItem>
</template>

<style scoped>
.license-addon-item {
	padding: 1.25rem !important;
	block-size: auto !important;
}

.addon-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 2.5rem;
	height: 2.5rem;
	border-radius: 50%;
	background-color: var(--theme--primary);
	margin-inline-end: 0.75rem;
	flex-shrink: 0;

	--v-icon-color: var(--white);
}

.addon-name {
	font-weight: 600;
	color: var(--theme--foreground);
}

.addon-pricing {
	font-size: 0.875rem;
	color: var(--theme--primary);
}
</style>
