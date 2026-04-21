<script setup lang="ts">
import type { LicenseUsageRow } from './types';
import VChip from '@/components/v-chip.vue';
import VIcon from '@/components/v-icon/v-icon.vue';

defineProps<{
	title: string;
	rows: LicenseUsageRow[];
}>();
</script>

<template>
	<section class="section">
		<h3 class="section-title">{{ title }}</h3>

		<div class="usage-grid">
			<div v-for="row in rows" :key="row.key" class="usage-row">
				<div class="usage-label">
					<VIcon :name="row.icon" />
					<span>{{ row.label }}</span>
				</div>
				<span v-if="row.value.type === 'text'" class="usage-value">{{ row.value.text }}</span>
				<VChip
					v-else
					small
					class="usage-chip"
					:class="{
						'usage-chip--primary': row.value.tone === 'primary',
						'usage-chip--neutral': row.value.tone === 'neutral',
					}"
				>
					{{ row.value.text }}
				</VChip>
			</div>
		</div>
	</section>
</template>

<style scoped lang="scss">
.section {
	display: grid;
	gap: 1rem;
}

.section-title {
	margin: 0;
	font-size: 1.25rem;
	line-height: 1.3;
	font-weight: 600;
	color: var(--theme--foreground-accent);
}

.usage-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 0.75rem 1rem;
}

.usage-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 1rem;
	padding: 0.875rem 1rem;
	border-radius: 0.5rem;
	background: var(--theme--form--field--input--background-subdued);
}

.usage-label {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	min-inline-size: 0;
	color: var(--theme--foreground);
	font-size: 0.9375rem;
}

.usage-label :deep(.v-icon) {
	--v-icon-color: var(--theme--foreground-subdued);
}

.usage-label span {
	font-weight: 600;
}

.usage-value {
	color: var(--theme--foreground-subdued);
	text-align: end;
}

.usage-chip {
	--v-chip-padding: 0 0.5rem;
	font-weight: 500;
}

.usage-chip--neutral {
	--v-chip-color: var(--theme--foreground);
	--v-chip-background-color: var(--theme--background-accent);
	--v-chip-border-color: var(--theme--background-accent);
}

.usage-chip--primary {
	--v-chip-color: var(--theme--primary);
	--v-chip-background-color: var(--theme--primary-background);
	--v-chip-border-color: var(--theme--primary-background);
}

@media (width <= 56rem) {
	.usage-grid {
		grid-template-columns: minmax(0, 1fr);
	}
}
</style>
