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
	/>

	<component
		:is="`${type}-options-${extensionInfo.id}`"
		v-else
		:value="options"
		:collection="collection"
		:field="field"
		@input="options = $event"
	/>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { getInterface } from '@/interfaces';
import { getDisplay } from '@/displays';
import { useFieldDetailStore } from '../store/';
import { get } from 'lodash';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

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
	},
	setup(props) {
		const fieldDetail = useFieldDetailStore();

		const { t } = useI18n();

		const { collection, field, relations, fields, collections } = storeToRefs(fieldDetail);

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
				optionsObjectOrArray = extensionInfo.value.options(fieldDetail);
			} else {
				optionsObjectOrArray = extensionInfo.value.options;
			}

			if (Array.isArray(optionsObjectOrArray)) return optionsObjectOrArray;

			if (props.showAdvanced) {
				return [...optionsObjectOrArray.standard, ...optionsObjectOrArray.advanced];
			}

			return optionsObjectOrArray.standard;
		});

		const options = computed({
			get() {
				const path = props.type === 'interface' ? 'field.meta.options' : 'field.meta.display_options';
				return get(fieldDetail, path);
			},
			set(val: any) {
				const key = props.type === 'interface' ? 'options' : 'display_options';

				fieldDetail.$patch((state) => {
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
			optionsFields,
			options,
			collection,
			field,
			relations,
			fields,
			collections,
			t,
		};
	},
});
</script>
