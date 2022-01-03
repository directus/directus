<template>
	<v-notice v-if="usesCustomComponent === false && optionsFields.length === 0">
		{{ t('no_options_available') }}
	</v-notice>

	<v-form
		v-else-if="usesCustomComponent === false"
		v-model="options"
		class="extension-options"
		:fields="optionsFields"
		primary-key="+"
		@update:model-value="$emit('field-values', options)"
	/>

	<component
		:is="`${type}-options-${extensionInfo.id}`"
		v-else
		:value="options"
		:collection="context.collection"
		:field="context.field"
		@update:model-value="$emit('field-values', options)"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, Ref, ref } from 'vue';
import { getInterface } from '@/interfaces';
import { getDisplay } from '@/displays';
import { useI18n } from 'vue-i18n';
import { DeepPartial, Field } from '@directus/shared/types';

interface Context {
	// change the any to an object of fields standard advanced
	optionsFields?: any;
	field: DeepPartial<Field>;
	collection?: Ref<string | undefined>;
	fields: DeepPartial<Field>[];
}

export default defineComponent({
	props: {
		type: {
			type: String as PropType<'interface' | 'display'>,
			required: true,
		},
		extension: {
			type: String,
			required: true,
		},
		showAdvanced: {
			type: Boolean,
			default: false,
		},
		context: {
			type: Object as PropType<Context>,
			required: true,
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

		// rename optionsFields to prevent confusion with props.context.optionsFields
		const optionsFields = computed(() => {
			if (!extensionInfo.value) return [];
			if (!extensionInfo.value.options) return [];
			if (usesCustomComponent.value === true) return [];

			let optionsObjectOrArray;

			if (props.context.optionsFields) {
				optionsObjectOrArray = props.context.optionsFields;
			} else {
				optionsObjectOrArray = extensionInfo.value.options;
			}

			if (Array.isArray(optionsObjectOrArray)) return optionsObjectOrArray;

			if (props.showAdvanced) {
				return [...optionsObjectOrArray.standard, ...optionsObjectOrArray.advanced];
			}

			return optionsObjectOrArray.standard;
		});

		const options = ref({});

		return {
			usesCustomComponent,
			extensionInfo,
			options,
			optionsFields,
			t,
		};
	},
});
</script>
