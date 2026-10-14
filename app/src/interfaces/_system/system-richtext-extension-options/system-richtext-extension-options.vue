<script setup lang="ts">
import type { RichTextOptionValues } from '@directus/extensions';
import type { Field } from '@directus/types';
import { computed } from 'vue';
import VForm from '@/components/v-form/v-form.vue';
import { useRichTexts } from '@/rich-text/register';

const props = defineProps<{
	value: Record<string, RichTextOptionValues> | null;
	extensions?: string[];
	disabled?: boolean;
}>();

const emit = defineEmits<{
	input: [value: Record<string, RichTextOptionValues> | null];
}>();

const richTexts = useRichTexts();

const configurable = computed(() =>
	richTexts.value.flatMap((config) =>
		props.extensions?.includes(config.id) && config.options?.length
			? [{ id: config.id, name: config.name, fields: config.options as Field[] }]
			: [],
	),
);

// values of an extension the field switched off stay, so switching it back on restores them
function update(id: string, values: RichTextOptionValues) {
	emit('input', { ...props.value, [id]: values });
}
</script>

<template>
	<div class="richtext-extension-options">
		<div v-for="config in configurable" :key="config.id">
			<p class="label type-label">
				{{ $t('interfaces.input-rich-text-html.extension_options_for', { extension: config.name }) }}
			</p>
			<div class="inset">
				<VForm
					:model-value="value?.[config.id] ?? {}"
					:fields="config.fields"
					:disabled="disabled"
					primary-key="+"
					@update:model-value="update(config.id, $event)"
				/>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.richtext-extension-options {
	display: flex;
	flex-direction: column;
	gap: var(--theme--form--row-gap);
}

.label {
	margin-block-end: 0.4375rem;
	color: var(--theme--form--field--label--foreground);
}

.inset {
	--theme--form--column-gap: 1.375rem;
	--theme--form--row-gap: 1.375rem;

	padding: 0.6875rem;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);

	:deep(.type-label) {
		font-size: 0.8125rem;
	}
}
</style>
