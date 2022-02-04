<template>
	<v-notice v-if="usesCustomComponent === false && optionsFields.length === 0">
		{{ t('no_options_available') }}
	</v-notice>

	<v-form
		v-else-if="usesCustomComponent === false"
		v-model="optionsValues"
		class="extension-options"
		:fields="optionsFields"
		primary-key="+"
	/>

	<component
		:is="`${type}-options-${extensionInfo.id}`"
		v-else
		v-model="optionsValues"
		:value="optionsValues"
		:collection="collection"
		:field="field"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { getInterface } from '@/interfaces';
import { getDisplay } from '@/displays';
import { getPanel } from '@/panels';
import { useI18n } from 'vue-i18n';
import { Field } from '@directus/shared/types';

export default defineComponent({
	props: {
		type: {
			type: String as PropType<'interface' | 'display' | 'panel'>,
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
		collection: {
			type: String,
			default: '',
		},
		field: {
			type: Object as PropType<Field>,
			default: null,
		},
	},
	emits: ['update:model-value'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const extensionInfo = computed(() => {
			switch (props.type) {
				case 'interface':
					return getInterface(props.extension);
				case 'display':
					return getDisplay(props.extension);
				case 'panel':
					return getPanel(props.extension);
				default:
					return null;
			}
		});

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
				emit('update:model-value', values);
			},
		});

		return {
			usesCustomComponent,
			extensionInfo,
			optionsValues,
			optionsFields,
			t,
		};
	},
});
</script>
