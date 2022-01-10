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
		@update:model-value="$emit('field-values', optionsValues)"
	/>

	<component
		:is="`${type}-options-${extensionInfo.id}`"
		v-else
		:value="optionsValues"
		:collection="collection"
		:field="field"
		@update:model-value="$emit('field-values', optionsValues)"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from 'vue';
import { getInterface } from '@/interfaces';
import { getDisplay } from '@/displays';
import { useI18n } from 'vue-i18n';
import { Field } from '@directus/shared/types';

export default defineComponent({
	props: {
		type: {
			type: String as PropType<'interface' | 'display'>,
			default: 'interface',
		},
		extension: {
			type: String,
			default: '',
		},
		showAdvanced: {
			type: Boolean,
			default: false,
		},
		options: {
			type: Object,
			default: () => {
				return {};
			},
		},
		values: {
			type: Object,
			default: () => {
				return {};
			},
		},
		collection: {
			type: String,
			default: '',
		},
		field: {
			type: Object as PropType<Field>,
			default: () => {
				return {};
			},
		},
	},
	emits: ['field-values'],
	setup(props) {
		const { t } = useI18n();

		const extensionInfo = computed(() => {
			switch (props.type) {
				case 'interface':
					return getInterface(props.extension);
				case 'display':
					return getDisplay(props.extension);
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

			if (Array.isArray(optionsObjectOrArray)) return optionsObjectOrArray;

			if (props.showAdvanced) {
				return [...optionsObjectOrArray.standard, ...optionsObjectOrArray.advanced];
			}

			return optionsObjectOrArray.standard;
		});

		const optionsValues = ref(props.values);

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
