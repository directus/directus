<script setup lang="ts">
import { useSlots } from 'vue';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	icon: string;
	title: string;
	included?: boolean;
	unlimited?: boolean;
}>();

const slots = useSlots();
</script>

<template>
	<div class="license-entitlement-item">
		<div class="label">
			<VIcon :name="icon" />
			<span>{{ title }}</span>
		</div>
		<div class="value">
			<VChip v-if="unlimited" x-small :label="false" kind="success">
				{{ $t('licensing.unlimited') }}
			</VChip>
			<slot v-else-if="slots.default" />
			<VChip v-else x-small :label="false" :kind="included ? 'success' : 'neutral'">
				{{ included ? $t('licensing.included') : $t('licensing.not_included') }}
			</VChip>
		</div>
	</div>
</template>

<style scoped>
.license-entitlement-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.5rem 0.625rem;
	font-weight: 600;
	background-color: var(--theme--background-subdued);
	border-radius: var(--theme--border-radius);
}

.label {
	--v-icon-color: var(--theme--foreground-subdued);

	display: flex;
	align-items: center;
	gap: 0.5rem;
	color: var(--theme--foreground);
}
</style>
