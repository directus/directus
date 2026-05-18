<script setup lang="ts">
import type { LicenseAddon } from '@directus/license';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import LicenseAddonPurchaseDialog from './license-addon-purchase-dialog.vue';
import VButton from '@/components/v-button.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItem from '@/components/v-list-item.vue';
import { getRootPath } from '@/utils/get-root-path';

const props = defineProps<{
	addon: LicenseAddon;
}>();

const { t } = useI18n();

const dialogOpen = ref(false);

const buttonState = computed<'manage' | 'purchase' | 'contact_sales'>(() => {
	if (props.addon.upgrade_required) return 'contact_sales';
	if (props.addon.active_quantity > 0) return 'manage';
	return 'purchase';
});

const buttonLabel = computed(() => {
	switch (buttonState.value) {
		case 'manage':
			return t('licensing.addon_manage');
		case 'contact_sales':
			return t('licensing.addon_contact_sales');
		default:
			return t('licensing.addon_purchase');
	}
});

const buttonIcon = computed(() => {
	switch (buttonState.value) {
		case 'manage':
			return 'settings';
		case 'contact_sales':
			return 'mail';
		default:
			return 'add_shopping_cart';
	}
});

const portalHref = `${getRootPath()}license/portal`;

function onClick() {
	dialogOpen.value = true;
}
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
		<VButton
			v-if="buttonState === 'contact_sales'"
			secondary
			:href="portalHref"
			target="_blank"
			rel="noopener noreferrer"
		>
			<VIcon :name="buttonIcon" left />
			{{ buttonLabel }}
		</VButton>
		<VButton v-else secondary @click="onClick">
			<VIcon :name="buttonIcon" left />
			{{ buttonLabel }}
		</VButton>

		<LicenseAddonPurchaseDialog v-model="dialogOpen" :addon="addon" />
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
