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
import { defineComponent, PropType, computed, Ref } from 'vue';
import { getInterface } from '@/interfaces';
import { getDisplay } from '@/displays';
import { get } from 'lodash';
import { useI18n } from 'vue-i18n';
import { DeepPartial, ExtensionOptionsContext, Field, Relation } from '@directus/shared/types';

interface Context {
	fieldDetail: ExtensionOptionsContext;
	field: DeepPartial<Field>;
	collection: Ref<string | undefined>;
	relations: DeepPartial<Relation>;
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

		const optionsFields = computed(() => {
			if (!extensionInfo.value) return [];
			if (!extensionInfo.value.options) return [];
			if (usesCustomComponent.value === true) return [];

			let optionsObjectOrArray;

			if (typeof extensionInfo.value.options === 'function') {
				optionsObjectOrArray = extensionInfo.value.options(props.context.fieldDetail);
			} else {
				optionsObjectOrArray = extensionInfo.value.options;
			}

			if (Array.isArray(optionsObjectOrArray)) return optionsObjectOrArray;

			if (props.showAdvanced) {
				return [...optionsObjectOrArray.standard, ...optionsObjectOrArray.advanced];
			}

			return optionsObjectOrArray.standard;
		});
		// get rid of options, pass options from above.
		const options = computed({
			get() {
				// instead of getting pass from above
				const path = props.type === 'interface' ? 'field.meta.options' : 'field.meta.display_options';
				return get(props.context.fieldDetail, path);
			},
			set(val: any) {
				// instead of setting to fieldDetail, set to 2 way binding var passed from above
				const key = props.type === 'interface' ? 'options' : 'display_options';

				props.context.fieldDetail.$patch((state) => {
					state.field.meta = {
						...state.field.meta,
						[key]: val,
					};
				});
			},
		});

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
