<template>
	<v-notice v-if="usesCustomComponent === false && optionsFields.length === 0">
		{{ t('no_options_available') }}
	</v-notice>

	<v-form
		v-else-if="usesCustomComponent === false"
		v-model="optionsValues"
		class="extension-options"
		:fields="optionsFields"
		:initial-values="disabled ? optionsValues : null"
		:disabled="disabled"
		:raw-editor-enabled="rawEditorEnabled"
		primary-key="+"
	/>

	<component
		:is="`${type}-options-${extensionInfo!.id}`"
		v-else
		:value="optionsValues"
		:collection="collection"
		:field="field"
		@input="optionsValues = $event"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFieldDetailStore } from '../store';
import { storeToRefs } from 'pinia';
import { useExtension } from '@/composables/use-extension';

export default defineComponent({
	props: {
		type: {
			type: String as PropType<'interface' | 'display' | 'panel' | 'operation'>,
			required: true,
		},
		extension: {
			type: String,
			default: null,
		},
		showAdvanced: {
			type: Boolean,
			default: false,
		},
		options: {
			type: Object,
			default: null,
		},
		modelValue: {
			type: Object,
			default: () => ({}),
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		rawEditorEnabled: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const fieldDetailStore = useFieldDetailStore();

		const { collection, field } = storeToRefs(fieldDetailStore);

		const extensionInfo = useExtension(props.type, props.extension);

		const usesCustomComponent = computed(() => {
			if (!extensionInfo.value) return false;

			return extensionInfo.value.options && 'render' in extensionInfo.value.options;
		});

		const optionsFields = computed(() => {
			if (usesCustomComponent.value === true) return [];

			let optionsObjectOrArray;

			if (props.options) {
				optionsObjectOrArray = props.options;
			} else {
				if (!extensionInfo.value) return [];
				if (!extensionInfo.value?.options) return [];
				optionsObjectOrArray = extensionInfo.value.options;
			}

			if (!optionsObjectOrArray) return [];

			if (Array.isArray(optionsObjectOrArray)) return optionsObjectOrArray;

			if (props.showAdvanced) {
				return [...optionsObjectOrArray.standard, ...optionsObjectOrArray.advanced];
			}

			return optionsObjectOrArray.standard;
		});

		const optionsValues = computed({
			get() {
				return props.modelValue;
			},
			set(values: Record<string, any>) {
				emit('update:modelValue', values);
			},
		});

		return {
			usesCustomComponent,
			extensionInfo,
			optionsValues,
			optionsFields,
			t,
			collection,
			field,
		};
	},
});
</script>
