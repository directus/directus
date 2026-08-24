<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import VCheckbox from '@/components/v-checkbox.vue';

const props = defineProps<{
	/** Whether the user has confirmed SSO deactivation (v-model) */
	modelValue: boolean;
}>();

const emit = defineEmits<{
	'update:modelValue': [value: boolean];
	/** Emitted when the user checks the box — the parent opens the admin confirmation dialog */
	'open-admin-dialog': [];
}>();

const { t } = useI18n();

function toggle() {
	// Turning on requires confirming admin credentials first
	if (!props.modelValue) emit('open-admin-dialog');
	else emit('update:modelValue', false);
}
</script>

<template>
	<section class="resolution-sso-section">
		<header class="section-header">
			<span class="section-title">{{ t('licensing.resolve_section_sso') }}</span>
		</header>

		<button type="button" class="confirm" :class="{ selected: modelValue }" @click="toggle">
			<VCheckbox :model-value="modelValue" />
			<span>{{ t('licensing.resolve_sso_confirm') }}</span>
		</button>

		<p class="caption">{{ t('licensing.resolve_sso_caption') }}</p>
	</section>
</template>

<style scoped>
.section-header {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	margin-block-end: 0.75rem;
}

.section-title {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	font-size: 0.875rem;
	font-weight: 600;
	color: var(--theme--foreground-accent);
}

.confirm {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	inline-size: 100%;
	padding: 0.5rem 0.75rem;
	border: 1px solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);
	background: var(--theme--form--field--input--background);
	color: var(--theme--foreground);
	font: inherit;
	text-align: start;
	cursor: pointer;
	transition: border-color var(--fast) var(--transition);
}

.confirm:hover {
	border-color: var(--theme--form--field--input--border-color-hover);
}

.confirm.selected {
	border-color: var(--theme--primary);
}

.caption {
	color: var(--theme--foreground-subdued);
	margin-block-start: 0.5rem;
	font-size: 0.8125rem;
	line-height: 1.4;
}
</style>
