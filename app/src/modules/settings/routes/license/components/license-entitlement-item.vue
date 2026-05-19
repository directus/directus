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
			<VIcon :name="icon" small />
			<span>{{ title }}</span>
		</div>
		<div class="value">
			<VChip v-if="unlimited" x-small class="unlimited">
				{{ $t('licensing.unlimited') }}
			</VChip>
			<slot v-else-if="slots.default" />
			<VChip v-else x-small :class="{ included }">
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
	padding: 0.5rem 0.625rem;
	background-color: var(--theme--background-subdued);
	border-radius: 6px;
}

.label {
	display: flex;
	align-items: center;
	font-weight: 600;
	gap: 0.5rem;
	color: var(--theme--foreground);
}

.label :deep(.v-icon) {
	color: var(--theme--foreground-subdued);
}

.value {
	color: var(--theme--foreground);
}

.value :deep(.v-chip) {
	--v-chip-background-color: var(--theme--background-accent);
	--v-chip-color: var(--theme--foreground);
	--v-chip-padding: 0 0.625rem;
	border-radius: 9999px;
	font-weight: 600;
}

.value :deep(.v-chip.included),
.value :deep(.v-chip.unlimited) {
	--v-chip-background-color: var(--theme--success-subdued);
	--v-chip-color: var(--theme--success-accent);
}
</style>
