<template>
	<v-notice v-if="!selectedInterface">
		{{ t('select_interface') }}
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
			primary-key="+"
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

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, computed, inject, ref } from 'vue';
import { useExtension } from '@/composables/use-extension';

export default defineComponent({
	props: {
		value: {
			type: Object,
			default: null,
		},
		interfaceField: {
			type: String,
			default: null,
		},
		interface: {
			type: String,
			default: null,
		},
		collection: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
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

		const selectedInterfaceId = computed(() => props.interface ?? values.value[props.interfaceField] ?? null);
		const selectedInterface = useExtension('interface', selectedInterfaceId);

		const usesCustomComponent = computed(() => {
			if (!selectedInterface.value) return false;
			return selectedInterface.value.options && 'render' in selectedInterface.value.options;
		});

		const optionsFields = computed(() => {
			if (!selectedInterface.value) return [];
			if (!selectedInterface.value.options) return [];
			if (usesCustomComponent.value === true) return [];

			let optionsObjectOrArray;

			if (typeof selectedInterface.value.options === 'function') {
				optionsObjectOrArray = selectedInterface.value.options({
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
				});
			} else {
				optionsObjectOrArray = selectedInterface.value.options;
			}

			if (Array.isArray(optionsObjectOrArray)) return optionsObjectOrArray;

			return [...optionsObjectOrArray.standard, ...optionsObjectOrArray.advanced];
		});

		return { t, selectedInterface, values, usesCustomComponent, optionsFields, options };
	},
});
</script>

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
