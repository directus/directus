<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import type { ExtensionOptionsContext } from '@directus/extensions';
import { isVueComponent } from '@directus/utils';
import { computed, inject, ref } from 'vue';

const props = defineProps<{
	value: Record<string, unknown> | null;
	interfaceField?: string;
	interface?: string;
	collection?: string;
	disabled?: boolean;
	isConditionOptions?: boolean;
	context?: () => ExtensionOptionsContext;
}>();

const emit = defineEmits<{
	(e: 'input', value: Record<string, unknown> | null): void;
}>();

const options = computed({
	get() {
		return props.value;
	},
	set(newVal: any) {
		emit('input', newVal);
	},
});

const values = inject('values', ref<Record<string, any>>({}));

const selectedInterfaceId = computed(() => props.interface ?? values.value[props.interfaceField!] ?? null);
const selectedInterface = useExtension('interface', selectedInterfaceId);

const usesCustomComponent = computed(() => {
	if (!selectedInterface.value) return false;

	return isVueComponent(selectedInterface.value.options);
});

const optionsFields = computed(() => {
	if (!selectedInterface.value?.options || usesCustomComponent.value) return [];

	let optionsObjectOrArray;

	if (typeof selectedInterface.value.options === 'function') {
		optionsObjectOrArray = selectedInterface.value.options(
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
			},
		);
	} else {
		optionsObjectOrArray = selectedInterface.value.options;
	}

	if (Array.isArray(optionsObjectOrArray)) return optionsObjectOrArray;

	return [...optionsObjectOrArray.standard, ...optionsObjectOrArray.advanced];
});
</script>

<template>
	<v-notice v-if="!selectedInterface">
		{{ $$t('select_interface') }}
	</v-notice>

	<v-notice v-else-if="usesCustomComponent === false && optionsFields.length === 0">
		{{ $$t('no_options_available') }}
	</v-notice>

	<div v-else class="inset">
		<v-form
			v-if="usesCustomComponent === false"
			v-model="options"
			class="extension-options"
			:fields="optionsFields"
			:disabled="disabled"
			primary-key="+"
			:batch-mode="isConditionOptions"
		/>

		<component
			:is="`interface-options-${selectedInterface.id}`"
			v-else
			:value="value"
			:collection="collection"
			@input="$emit('input', $event)"
		/>
	</div>
</template>

<style lang="scss" scoped>
.inset {
	--theme--form--column-gap: 24px;
	--theme--form--row-gap: 24px;

	padding: 12px;
	border: var(--theme--border-width) solid var(--theme--form--field--input--border-color);
	border-radius: var(--theme--border-radius);

	:deep(.type-label) {
		font-size: 1rem;
	}
}
</style>
