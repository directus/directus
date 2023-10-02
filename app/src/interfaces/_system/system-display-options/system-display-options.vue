<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { ExtensionOptionsContext } from '@directus/types';
import { isVueComponent } from '@directus/utils';
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
	value: Record<string, unknown> | null;
	displayField?: string;
	display?: string;
	collection?: string;
	disabled?: boolean;
	context?: () => ExtensionOptionsContext;
}>();

const emit = defineEmits<{
	input: [value: Record<string, unknown> | null];
}>();

const { t } = useI18n();

const options = computed({
	get() {
		return props.value;
	},
	set(newVal: any) {
		emit('input', newVal);
	},
});

const values = inject('values', ref<Record<string, any>>({}));

const selectedDisplayId = computed(() => props.display ?? values.value[props.displayField!] ?? null);
const selectedDisplay = useExtension('display', selectedDisplayId);

const usesCustomComponent = computed(() => {
	if (!selectedDisplay.value) return false;

	return isVueComponent(selectedDisplay.value.options);
});

const optionsFields = computed(() => {
	if (!selectedDisplay.value?.options || usesCustomComponent.value) return [];

	let optionsObjectOrArray;

	if (typeof selectedDisplay.value.options === 'function') {
		optionsObjectOrArray = selectedDisplay.value.options(
			props.context?.() ?? {
				field: {
					type: 'unknown',
				},
				editing: '+',
				collection: props.collection,
				relations: {
					o2m: undefined,
					m2o: undefined,
					m2a: undefined,
				},
				collections: {
					related: undefined,
					junction: undefined,
				},
				fields: {
					corresponding: undefined,
					junctionCurrent: undefined,
					junctionRelated: undefined,
					sort: undefined,
				},
				items: {},
				localType: 'standard',
				autoGenerateJunctionRelation: false,
				saving: false,
			}
		);
	} else {
		optionsObjectOrArray = selectedDisplay.value.options;
	}

	if (Array.isArray(optionsObjectOrArray)) return optionsObjectOrArray;

	return [...optionsObjectOrArray.standard, ...optionsObjectOrArray.advanced];
});
</script>

<template>
	<v-notice v-if="!selectedDisplay">
		{{ t('select_display') }}
	</v-notice>

	<v-notice v-else-if="usesCustomComponent === false && optionsFields.length === 0">
		{{ t('no_options_available') }}
	</v-notice>

	<div v-else class="inset">
		<v-form
			v-if="usesCustomComponent === false"
			v-model="options"
			class="extension-options"
			:fields="optionsFields"
			:disabled="disabled"
			primary-key="+"
		/>

		<component
			:is="`display-options-${selectedDisplay.id}`"
			v-else
			:value="value"
			:collection="collection"
			@input="$emit('input', $event)"
		/>
	</div>
</template>

<style lang="scss" scoped>
.inset {
	--form-horizontal-gap: 24px;
	--form-vertical-gap: 24px;

	padding: 12px;
	border: var(--border-width) solid var(--border-normal);
	border-radius: var(--border-radius);

	:deep(.type-label) {
		font-size: 1rem;
	}
}
</style>
